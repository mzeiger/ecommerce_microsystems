const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
});

exports.updateCategoryImage = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    const record = event.Records[0];

    // get s3 bucket name from event record
    const bucketName = record.s3.bucket.name;
    // extract the file name directly from the s3 event record
    const fileName = record.s3.object.key;

    // construct a public url on how the uploaded file will be accessed
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    // prepare the dynamoDb update command
    const updateItemCommand = new UpdateItemCommand({
      TableName: tableName,
      Key: { fileName: { S: fileName } },
      // in dynamoDb if field (column) being "SET" does not exist it will be created else the
      // field the value of the field will be updated
      UpdateExpression: "SET imageUrl = :imageUrl", // :imageUrl is a placeholder
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageUrl }, // imageUrl is the value for the placeholder above
      },
    });
    await dynamoDbClient.send(updateItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "image url updated successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
