const {
  CognitoIdentityProviderClient,
  SignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const UserModel = require("../models/userModel");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

const CLIENT_ID = process.env.CLIENT_ID;

exports.signUp = async (event) => {
  const { email, fullName, password } = JSON.parse(event.body);

  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: fullName },
    ],
  };

  try {
    const command = new SignUpCommand(params);
    await client.send(command);

    const newUser = new UserModel(email, fullName);

    await newUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "User successfully signed up" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "unexpected error", detail: error.message }),
    };
  }
};
