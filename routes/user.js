const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyToken, bcrypt } = require("../utils/auth");

router.put("/update-email", verifyToken, async (req, res) => {
  const { email } = req.body;
  const userId = req.userId;

  if (!email) {
    return res.status(400).send("Email is required");
  }

  try {
    const user = await User.findOneById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.email = email;
    await User.updateUser(user);
    res.send("Email updated successfully");
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).send("Error updating email");
  }
});

router.put("/update-password", verifyToken, async (req, res) => {
  const { password } = req.body;
  const userId = req.userId;

  if (!password) {
    return res.status(400).send("Password is required");
  }

  try {
    const user = await User.findOneById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    user.password = hashedPassword;
    await User.updateUser(user);
    res.send("Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("Error updating password");
  }
});

module.exports = router;
