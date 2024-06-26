const multer = require("multer");

const voiceSampleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const voiceSampleFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only MP3, WAV, OGG, and FLAC are allowed."),
      false
    );
  }
};

const voiceSampleUpload = multer({
  storage: voiceSampleStorage,
  fileFilter: voiceSampleFilter,
});

module.exports = voiceSampleUpload;
