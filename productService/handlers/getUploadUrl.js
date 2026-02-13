// This lambda function:
// 1 - Adds fileName, fileType, productName, etc. to DynamoDb "Products" table
// 2 - Returns an upload URL to download a product image
//     2a = The URL also adds the image's URL to the "Products" table
//          by running updateProductImage
//
// If sign-in needed the url is:
//     https://qwoxrlhyhb.execute-api.us-east-2.amazonaws.com/sign-in

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto");

const s3Client = new S3Client({ region: process.env.REGION });
const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.getUploadUrl = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME;
    const {
      fileName,
      fileType,
      productName,
      productPrice,
      description,
      quantity,
      category,
      email,
    } = JSON.parse(event.body);
    if (
      !fileName ||
      !fileType ||
      !productName ||
      !productPrice ||
      !description ||
      !quantity ||
      !category ||
      !email
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "All fields are required" }),
      };
    }
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expires: 3600 });
    const productId = crypto.randomUUID();
    const putItemCommand = new PutItemCommand({
      TableName: process.env.DYNAMO_TABLE,
      Item: {
        id: { S: productId },
        fileName: { S: fileName },
        productName: { S: productName },
        category: { S: category },
        productPrice: { N: productPrice.toString() },
        description: { S: description },
        quantity: { N: quantity.toString() },
        email: { S: email },
        isApproved: { BOOL: false },
        createdAt: { S: new Date().toISOString() },
        //createdAt: { S: new Date().toLocaleString("en-US") },
        //createdAt: {S: new Date().toLocaleString("en-US", { timeZone: "America/Denver" })}
      },
    });
    await dynamoDbClient.send(putItemCommand);
    return {
      statusCode: 201,
      body: JSON.stringify({ uploadUrl: signedUrl }),
    };
  } catch (error) {
    console.error("getUploadUrl error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, stack: error.stack }),
    };
  }
};
