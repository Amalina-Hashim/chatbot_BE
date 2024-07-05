const { ElevenLabsClient } = require("elevenlabs");
const { createWriteStream } = require("fs");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const createAudioFileFromText = async (text) => {
  return new Promise(async (resolve, reject) => {
    try {
      const audio = await client.generate({
        voice: "KGZYHfBYGAwgJIZze4iF", // Replace with your custom voice ID if needed
        model_id: "eleven_turbo_v2",
        text,
      });
      const fileName = `${uuid()}.mp3`;
      const fileStream = createWriteStream(fileName);

      audio.pipe(fileStream);
      fileStream.on("finish", () => resolve(fileName)); // Resolve with the fileName
      fileStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { createAudioFileFromText };
