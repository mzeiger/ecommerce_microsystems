const {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: process.env.REGION });

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.cleanupCategories = async () => {
  try {
    // The purpose of this lanbda function is to delete any categories that do not
    // have an image after opne hour of its creation
    const tableName = process.env.DYNAMODB_TABLE;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    /*
        Create a scan command to find categories that are:
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
    if (!Items || Items.length == 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ msg: "No categories were deleted" }),
      };
    } else {
      let deletedCount = 0;
      // Iterate over each outdated category and delete it from the database
      for (const item of Items) {
        // create a delete command using the category's unique identifier (fileName)
        const deleteItemCommand = new DeleteItemCommand({
          TableName: tableName,
          Key: { fileName: { S: item.fileName.S } },
        });
        await dynamoDbClient.send(deleteItemCommand);
        deletedCount++;
      }
      // Send an SNS notification after deleting categories
      const snsMessage = `Cleanup completed. Deleted ${deletedCount} outdated categories`;
      await snsClient.send(
        new PublishCommand({
          TopicARN: snsTopicArn,
          Message: snsMessage,
          Subject: "Category cleanup notification",
        })
      );
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        msg: `${deletedCount} outdated categories were deleted`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
