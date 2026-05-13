const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { verifyToken } = require("../utils/auth");
const File = require("../models/File");
const User = require("../models/User");
const extractKeyInfo = require("../utils/extractKeyInfo");
const { createAudioFileFromText } = require("./textToSpeech");
const resumeContent = require("../my-website/src/components/Resume");
const portfolioContent = require("../my-website/src/db");

const router = express.Router();

const MAX_CONTEXT_LENGTH = 2000;
const MAX_OPENAI_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const OPENAI_REQUEST_TIMEOUT_MS = 12000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS || 260);

const SUPPORTED_CONTEXT_FILE_TYPES = new Set([
  "application/pdf",
  "application-pdf",
  "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/word",
  "application/vnd.ms-word.document.macroEnabled.12",
  "application/vnd.ms-word.template.macroEnabled.12",
  "application-vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const normalizeFallbackText = (text) =>
  (text || "")
    .replace(/[\t\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();

const splitIntoSnippets = (text) =>
  normalizeFallbackText(text)
    .split(/\n|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 35)
    .map((part) => (part.length > 220 ? `${part.slice(0, 217)}...` : part));

const openAIRequest = async (context, message, username) => {
  for (let attempt = 0; attempt <= MAX_OPENAI_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: OPENAI_MODEL,
          max_tokens: OPENAI_MAX_TOKENS,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `You are ${username}. Use only the profile information below to answer.

Rules:
- Be concise and factual.
- If information is not present in the profile context, say you do not have that information.
- Do not invent achievements, companies, dates, or certifications.
- Prefer bullet points for summaries.

Profile context:\n\n${context}`,
            },
            { role: "user", content: message },
          ],
        },
        {
          timeout: OPENAI_REQUEST_TIMEOUT_MS,
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        },
      );
      return response.data;
    } catch (error) {
      const statusCode = error?.response?.status;
      const isRateLimited = statusCode === 429;

      if (!isRateLimited || attempt === MAX_OPENAI_RETRIES) {
        console.error("Error in openAIRequest:", error.message);
        throw error;
      }

      const retryAfterHeader = error.response.headers["retry-after"];
      const retryAfterMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : 0;
      const backoffMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
      const delayMs = Math.max(retryAfterMs, backoffMs);

      console.error(`Rate limited. Retrying after ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const readPdfContent = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
};

const readDocxContent = async (filePath) => {
  const data = await mammoth.extractRawText({ path: filePath });
  return data.value;
};

const readTxtContent = async (filePath) => {
  return fs.readFileSync(filePath, "utf8");
};

const readFileContent = async (filePath, fileType) => {
  console.log(`Reading file content. File type: ${fileType}`);
  switch (fileType) {
    case "application/pdf":
    case "application-pdf":
    case "pdf":
      return await readPdfContent(filePath);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
    case "application/word":
    case "application/vnd.ms-word.document.macroEnabled.12":
    case "application/vnd.ms-word.template.macroEnabled.12":
    case "application-vnd.openxmlformats-officedocument.wordprocessingml.document": // Additional case
      return await readDocxContent(filePath);
    case "text/plain":
      return readTxtContent(filePath);
    default:
      console.error(`Unsupported file type: ${fileType}`);
      throw new Error("Unsupported file type");
  }
};

const synthesizeSpeech = async (text) => {
  try {
    const audioFileName = await createAudioFileFromText(text);
    const audioFilePath = path.join(__dirname, "../uploads", audioFileName);
    fs.renameSync(audioFileName, audioFilePath); // Move file to uploads directory
    return audioFileName;
  } catch (error) {
    console.error("Error synthesizing speech with Eleven Labs: ", error);
    throw error;
  }
};

const getResumeContext = () => {
  let context = "Resume:\n\n";

  context += "Core Competencies:\n";
  context += resumeContent.coreCompetencies.join("\n") + "\n\n";

  context += "Technical Skills:\n";
  context += resumeContent.technicalSkills.join("\n") + "\n\n";

  context += "Key Achievements:\n";
  resumeContent.keyAchievements.forEach((achievement, index) => {
    context += `${index + 1}. ${achievement}\n`;
  });

  context += "\nProfessional Experience:\n";
  resumeContent.professionalExperience.forEach((experience) => {
    context += `Role: ${experience.role}\nCompany: ${experience.company}\nPeriod: ${experience.period}\n`;
    experience.points.forEach((point) => {
      context += `- ${point}\n`;
    });
    context += "\n";
  });

  return context;
};

const getPortfolioContext = () => {
  let context = "Portfolio:\n\n";

  portfolioContent.portfolio.forEach((project) => {
    context += `Title: ${project.title}\n`;
    context += project.descriptions.join("\n") + "\n\n";
    project.listItems.forEach((item) => {
      context += `- ${item}\n`;
    });
    context += "\n";
  });

  return context;
};

router.post("/", verifyToken, async (req, res) => {
  console.log("POST /chat endpoint hit");
  const { message } = req.body;
  const userId = req.userId;
  console.log("User ID:", userId);
  console.log("Message:", message);

  try {
    const userFiles = await File.findFilesByUserId(userId);
    const user = await User.findOneById(userId);
    const username = user.username;
    console.log("User found:", user);

    let context = `Here is the personal information of ${username}:\n\n`;

    if (message.toLowerCase().includes("resume")) {
      context += getResumeContext();
    } else if (message.toLowerCase().includes("portfolio")) {
      context += getPortfolioContext();
    } else {
      const candidateFiles = userFiles
        .filter((file) => SUPPORTED_CONTEXT_FILE_TYPES.has(file.fileType))
        .sort((a, b) => (b._ts || 0) - (a._ts || 0));

      const contextSourceFile = candidateFiles[0];

      if (!contextSourceFile) {
        console.log("No supported context file found for user");
      }

      for (const file of contextSourceFile ? [contextSourceFile] : []) {
        const filePath = path.join(__dirname, "../", file.filePath);
        console.log(`Processing file: ${filePath}`);
        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${filePath}, skipping`);
          continue;
        }
        try {
          const hasValidCache =
            typeof file.cachedContext === "string" &&
            file.cachedContext.trim() &&
            file.cachedFromPath === file.filePath;

          let summarizedFileContext = file.cachedContext || "";

          if (!hasValidCache) {
            const fileContent = await readFileContent(filePath, file.fileType);
            summarizedFileContext = extractKeyInfo(
              fileContent,
              MAX_CONTEXT_LENGTH,
            );
            await File.updateCachedContext(
              file.id,
              userId,
              summarizedFileContext,
              file.filePath,
            );
          }

          context += summarizedFileContext + "\n\n";
        } catch (fileError) {
          console.error(
            `Error processing file ${filePath}:`,
            fileError.message,
          );
        }
      }
    }

    if (context.length > MAX_CONTEXT_LENGTH) {
      context =
        context.slice(0, MAX_CONTEXT_LENGTH) + "... [content truncated]";
    }

    let responseData;
    try {
      responseData = await openAIRequest(context, message, username);
      console.log("OpenAI response:", responseData);
    } catch (openAIError) {
      console.error(
        "OpenAI unavailable, using fallback response:",
        openAIError.message,
      );
      responseData = buildFallbackResponse(context, message, username);
    }

    let audioFileName = "";
    try {
      audioFileName = await synthesizeSpeech(
        responseData.choices[0].message.content,
      );
      console.log("Audio file generated:", audioFileName);
    } catch (ttsError) {
      console.error(
        "Audio generation unavailable, returning text-only response:",
        ttsError.message,
      );
    }

    res.json({
      ...responseData,
      audioPath: audioFileName ? `/uploads/${audioFileName}` : "",
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
