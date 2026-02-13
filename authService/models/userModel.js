const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

//const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto"); // no need to install with npm. it's there by default

const TABLE_NAME = "Users";

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

class UserModel {
  constructor(email, fullName) {
    //this.userId = uuidv4();
    this.userId = crypto.randomUUID();
    this.email = email;
    this.fullName = fullName;
    this.state = ""; // defaults to empty string
    this.city = "";
    this.locality = "";
    this.createdAt = new Date().toISOString();
  }

  async save() {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: { S: this.userId },
        email: { S: this.email },
        fullName: { S: this.fullName },
        state: { S: this.state },
        city: { S: this.city },
        locality: { S: this.locality },
        createdAt: { S: this.createdAt },
      },
    };

    try {
      await dynamoDbClient.send(new PutItemCommand(params));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
