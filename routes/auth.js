const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateToken, bcrypt } = require("../utils/auth");

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send("Username, email, and password are required");
  }

  try {
    const existingUser = await User.findOne(username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await User.createUser(username, email, hashedPassword);
    const token = generateToken(user);
    res.status(201).send({ auth: true, token });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).send("Error signing up user");
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  try {
    const user = await User.findOne(username);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ auth: false, token: null });
    }

    const token = generateToken(user);
    res.status(200).send({ auth: true, token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).send("Error logging in user");
  }
});

module.exports = router;
