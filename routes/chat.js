const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { verifyToken } = require("../utils/auth");
const File = require("../models/File");
const User = require("../models/User");
const extractKeyInfo = require("../utils/extractKeyInfo");

const router = express.Router();

const MAX_CONTEXT_LENGTH = 2000;

const openAIRequest = async (context, message, username) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are ${username}. The following is your information:\n\n${context}`,
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers["retry-after"]
        ? parseInt(error.response.headers["retry-after"]) * 1000
        : 1000;
      console.error(`Rate limited. Retrying after ${retryAfter}ms`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return openAIRequest(context, message, username);
    } else {
      console.error("Error in openAIRequest:", error.message);
      throw error;
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
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  );
  const audioFileName = `${Date.now()}-response.wav`;
  const audioFilePath = path.join(__dirname, "../uploads", audioFileName);
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFilePath);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Synthesis finished.");
          resolve(audioFileName);
        } else {
          console.error("Speech synthesis canceled, " + result.errorDetails);
          reject(result.errorDetails);
        }
        synthesizer.close();
      },
      (error) => {
        console.error("Error synthesizing speech: ", error);
        synthesizer.close();
        reject(error);
      }
    );
  });
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

    for (const file of userFiles) {
      const filePath = path.join(__dirname, "../", file.filePath);
      console.log(`Processing file: ${filePath}`);
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}, skipping`);
        continue;
      }
      const fileContent = await readFileContent(filePath, file.fileType);
      context += extractKeyInfo(fileContent, MAX_CONTEXT_LENGTH) + "\n\n";
    }

    if (context.length > MAX_CONTEXT_LENGTH) {
      context =
        context.slice(0, MAX_CONTEXT_LENGTH) + "... [content truncated]";
    }

    const responseData = await openAIRequest(context, message, username);
    console.log("OpenAI response:", responseData);

    const audioFileName = await synthesizeSpeech(
      responseData.choices[0].message.content
    );
    console.log("Audio file generated:", audioFileName);

    res.json({
      ...responseData,
      audioPath: `/uploads/${audioFileName}`,
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).send("Error processing chat");
  }
});

module.exports = router;
