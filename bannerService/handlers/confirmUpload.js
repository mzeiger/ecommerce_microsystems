const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.confirmUpload = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    const bucketName = process.env.BUCKET_NAME;

    // An uploaded file triggers this event. It's not an http event, it's an S3 event
    const record = event.Records[0]; //Get the first record
    const fileName = record.s3.object.key; // gives us the file name

    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    const putItemCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        fileName: { S: fileName },
        imageUrl: { S: imageUrl },
        uploadedAt: { S: new Date().toISOString() },
      },
    });
    await dynamoDbClient.send(putItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "File uploaded and confirmed" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
