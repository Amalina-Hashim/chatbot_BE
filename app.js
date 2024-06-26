const { CosmosClient } = require("@azure/cosmos");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const axios = require("axios");
const path = require("path");

// Environment variables
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Routes
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/user"); 

app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);
app.use("/user", userRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
