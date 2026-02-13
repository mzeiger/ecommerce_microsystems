const {
  CognitoIdentityProviderClient,
  GlobalSignOutCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

// const CLIENT_ID = ProcessingInstruction.env.CLIENT_ID;  don't need since accessToken takes care of sign out

exports.signOut = async (event) => {
  const { accessToken } = JSON.parse(event.body);

  const params = {
    AccessToken: accessToken,
  };

  try {
    const command = new GlobalSignOutCommand(params);
    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        msg: "Sign Out was successful",
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Unexpected error",
        details: error.message,
      }),
    };
  }
};
