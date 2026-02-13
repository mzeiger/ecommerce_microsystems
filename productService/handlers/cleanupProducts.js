const {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: process.env.REGION });

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.cleanupProducts = async () => {
  try {
    // The purpose of this lambda function is to delete any products that do not
    // have an image after one hour of its creation
    const tableName = process.env.DYNAMO_TABLE;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    /*
        Create a scan command to find products that are:
           - older than one hour )createdAt < oneHourAgo
           - do not have an imageUrl field
        */
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression:
        "createdAt < :oneHourAgo AND attribute_not_exists(imageUrl)", // AND in all caps
      ExpressionAttributeValues: {
        ":oneHourAgo": { S: oneHourAgo },
      },
    });
    // Execute the scan command to retrieve matching items from the database
    const { Items } = await dynamoDbClient.send(scanCommand);

    // If no items are found indicate a response indicating no items deleted
    let deletedCount = 0;
    if (!Items || Items.length == 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ msg: "No products were deleted" }),
      };
    }

    // Iterate over each outdated product and delete it from the database
    for (const item of Items) {
      // delete using the product's primary key (`id`)
      const deleteItemCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: item.id.S } },
      });
      await dynamoDbClient.send(deleteItemCommand);
      deletedCount++;
    }

    // Send an SNS notification after deleting products
    const snsMessage = `Cleanup completed. Deleted ${deletedCount} outdated products`;
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Message: snsMessage,
        Subject: "Product cleanup notification",
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        msg: `${deletedCount} outdated products were deleted`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Product cleanup error message: ${error.message}`,
      }),
    };
  }
};
