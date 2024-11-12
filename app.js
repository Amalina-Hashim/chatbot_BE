const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

// Environment variables
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://happy-flower-0c7eb4a00.5.azurestaticapps.net",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Connect to Azure Cosmos DB
const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const databaseId = "chatbotproject";
const userContainerId = "users";
const fileContainerId = "files";
const botConfigContainerId = "botConfigs";

async function connectToCosmosDB() {
  try {
    const database = client.database(databaseId);
    const userContainer = database.container(userContainerId);
    const fileContainer = database.container(fileContainerId);
    const botConfigContainer = database.container(botConfigContainerId);
    console.log("Connected to Cosmos DB");
  } catch (err) {
    console.error("Error connecting to Cosmos DB", err);
  }
}

connectToCosmosDB();

// Ping route for warming up the backend
app.get("/ping", (req, res) => {
  res.status(200).send("Pong! Backend is alive.");
});

// Routes
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/user");
const widgetRoutes = require("./routes/widget");

app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);
app.use("/user", userRoutes);
app.use("/generate-widget", widgetRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
