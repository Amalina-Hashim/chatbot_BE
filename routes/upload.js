const express = require("express");
const { verifyToken } = require("../utils/auth");
const File = require("../models/File");
const User = require("../models/User");

const router = express.Router();

// Multer configurations
const generalFileUpload = require("../config/multerGeneralFile");
const voiceSampleUpload = require("../config/multerVoiceSample");

// File upload endpoint
router.post(
  "/file",
  verifyToken,
  generalFileUpload.single("file"),
  async (req, res) => {
    const { fileType } = req.body;
    const userId = req.userId;
    console.log("File upload - User ID from token:", userId); 

    try {
      const file = await File.createFile(userId, fileType, req.file.path);
      res.send("File uploaded");
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).send("Error uploading file");
    }
  }
);

// Voice sample upload endpoint
router.post(
  "/voice",
  verifyToken,
  voiceSampleUpload.single("voiceSample"),
  async (req, res) => {
    const userId = req.userId; 
    console.log("Voice upload - User ID from token:", userId); 

    try {
      const user = await User.findOneById(userId);
      console.log("Voice upload - User found:", user); 
      if (!user) {
        return res.status(404).send("User not found");
      }

      user.voiceSample = req.file.path;
      await User.updateUser(user); 
      res.send("Voice sample uploaded");
    } catch (error) {
      console.error("Error uploading voice sample:", error);
      res.status(500).send("Error uploading voice sample");
    }
  }
);

module.exports = router;
