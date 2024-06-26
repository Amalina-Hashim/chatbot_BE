const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const secretKey = process.env.JWT_SECRET_KEY || "your-secret-key";

function generateToken(user) {
  return jwt.sign({ id: user.id }, secretKey, { expiresIn: "12h" });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).send({ auth: false, message: "No token provided." });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res
      .status(403)
      .send({ auth: false, message: "Token format is incorrect." });
  }

  const token = tokenParts[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });
    }
    req.userId = decoded.id;
    next();
  });
}

module.exports = { generateToken, verifyToken, bcrypt };
