const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const database = client.database("chatbotproject");
const container = database.container("botConfigs");

class BotConfig {
  static async createConfig(userId, config) {
    const botConfig = {
      id: `${userId}-${Date.now()}`, 
      userId,
      config,
    };
    const { resource } = await container.items.create(botConfig);
    return resource;
  }

  static async findConfigByUserId(userId) {
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
    return resources[0]; 
  }
}

module.exports = BotConfig;
