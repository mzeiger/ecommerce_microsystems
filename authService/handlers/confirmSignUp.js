const {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

const CLIENT_ID = process.env.CLIENT_ID;

exports.confirmSignUp = async (event) => {
  const { email, confirmationCode } = JSON.parse(event.body);

  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
  };

  try {
    const command = new ConfirmSignUpCommand(params);
    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "User successfully verified" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to verify",
        details: error.message,
      }),
    };
  }
};
