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
        console.error(`Error processing file ${filePath}:`, fileError.message);
      }
    }

    if (context.length > MAX_CONTEXT_LENGTH) {
      context =
        context.slice(0, MAX_CONTEXT_LENGTH) + "... [content truncated]";
    }

    const responseData = await openAIRequest(context, message, username);
    console.log("OpenAI response:", responseData);

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
    const upstreamStatus = error?.response?.status;

    if (upstreamStatus === 429) {
      res.status(429).json({
        error: "The AI service is currently busy. Please try again shortly.",
      });
      return;
    }

    if (upstreamStatus >= 500 && upstreamStatus <= 599) {
      res.status(503).json({
        error: "The AI service is temporarily unavailable. Please try again.",
      });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
