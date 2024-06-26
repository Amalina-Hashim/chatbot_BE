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

const openAIRequest = async (context, message) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are Amalina Hashim. The following is your resume and personal information:\n\n${context}`,
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
      return openAIRequest(context, message);
    } else {
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
    case "pdf":
      return await readPdfContent(filePath);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
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
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput("output.wav");
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Synthesis finished.");
          resolve("output.wav");
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
  const { message } = req.body;
  const userId = req.userId;

  try {
    const userFiles = await File.findFilesByUserId(userId);
    const user = await User.findOneById(userId);

    let context = `Here is the resume and personal information of ${user.username}:\n\n`;

    for (const file of userFiles) {
      const filePath = path.join(__dirname, "../", file.filePath);
      console.log(`Processing file: ${file.filePath}`);
      const fileContent = await readFileContent(filePath, file.fileType);
      context += extractKeyInfo(fileContent, MAX_CONTEXT_LENGTH) + "\n\n";
    }

    if (context.length > MAX_CONTEXT_LENGTH) {
      context =
        context.slice(0, MAX_CONTEXT_LENGTH) + "... [content truncated]";
    }

    const responseData = await openAIRequest(context, message);

    const synthesizedAudioPath = await synthesizeSpeech(
      responseData.choices[0].message.content
    );

    res.json({
      ...responseData,
      audioPath: synthesizedAudioPath,
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).send("Error processing chat");
  }
});

module.exports = router;
