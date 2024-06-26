const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const database = client.database("chatbotproject");
const container = database.container("users");

class User {
  static async createUser(username, email, hashedPassword, voiceSample = null) {
    const user = {
      id: username, 
      username,
      email,
      password: hashedPassword,
      voiceSample,
    };
    const { resource } = await container.items.create(user);
    return resource;
  }

  static async findOneById(userId) {
    const querySpec = {
      query: "SELECT * from c WHERE c.id=@userId",
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

  static async findOne(username) {
    const querySpec = {
      query: "SELECT * from c WHERE c.username=@username",
      parameters: [
        {
          name: "@username",
          value: username,
        },
      ],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources[0];
  }

  static async updateUser(user) {
    const { resource } = await container
      .item(user.id, user.username)
      .replace(user);
    return resource;
  }
}

module.exports = User;
