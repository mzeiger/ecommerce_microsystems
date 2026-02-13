const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.getAllCategories = async () => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;

    const scanCommand = new ScanCommand({
      TableName: tableName,
    });
    const { Items } = await dynamoDbClient.send(scanCommand);
    if (!Items || Items.length == 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ msg: "No categories found" }),
      };
    } else {
      const categories = Items.map((item) => ({
        fileName: item.fileName.S,
        categoryName: item.categoryName.S,
        imageUrl: item.imageUrl?.S ?? null,
      }));
      return {
        statusCode: 200,
        body: JSON.stringify(categories),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error: ${error.message}` }),
    };
  }
};
