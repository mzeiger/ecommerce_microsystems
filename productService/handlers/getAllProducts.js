const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: process.env.Region });

exports.getAllProducts = async () => {
  try {
    const tableName = process.env.DYNAMO_TABLE;

    const scanCommand = new ScanCommand({
      TableName: tableName,
    });
    const { Items } = await dynamoDbClient.send(scanCommand);
    if (!Items || Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "getAllProducts: No products found" }),
      };
    } else {
      // Map DynamoDb items to a clean JS object
      const products = Items.map((item) => ({
        id: item.id?.S, // ".S" means return id as a string
        fileName: item.fileName?.S,
        fileType: item.fileType?.S,
        productName: item.productName?.S,
        category: item.category?.S,
        productPrice: item.productPrice
          ? parseFloat(item.productPrice.N)
          : null,
        description: item.description?.S,
        quantity: item.quantity ? parseInt(item.quantity.N) : null,
        email: item.email?.S,
        isApproved: item.isApproved?.BOOL,
        createdAt: item.createdAt?.S,
        imageUrl: item.imageUrl?.S || null,
      }));
      return {
        statusCode: 200,
        body: JSON.stringify(products),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `getAllProducts error: ${error.message}` }),
    };
  }
};
