const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const secretKey = process.env.JWT_SECRET_KEY || "your-secret-key";

function generateToken(user) {
  return jwt.sign({ id: user.id }, secretKey);
}

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log("No token provided");
    return res.status(403).send({ auth: false, message: "No token provided." });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    console.log("Token format is incorrect");
    return res
      .status(403)
      .send({ auth: false, message: "Token format is incorrect." });
  }

  const token = tokenParts[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log("Failed to authenticate token");
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });
    }
    req.userId = decoded.id;
    console.log("Token verified, user ID:", req.userId);
    next();
  });
}

module.exports = { generateToken, verifyToken, bcrypt };
