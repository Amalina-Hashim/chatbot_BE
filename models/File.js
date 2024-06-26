const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const database = client.database("chatbotproject");
const container = database.container("files");

class File {
  static async createFile(userId, fileType, filePath) {
    const file = {
      id: `${userId}-${fileType}-${Date.now()}`, 
      userId,
      fileType,
      filePath,
    };
    const { resource } = await container.items.create(file);
    return resource;
  }

  static async findFilesByUserId(userId) {
    const querySpec = {
      query: "SELECT * from c WHERE c.userId=@userId",
      parameters: [
        {
          name: "@userId",
          value: userId,
        },
      ],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }
}

module.exports = File;
