const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

const CLIENT_ID = process.env.CLIENT_ID;

exports.signIn = async (event) => {
  const { email, password } = JSON.parse(event.body);

  params = {
    ClientId: CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        msg: "Sign In was successful",
        tokens: response.AuthenticationResult,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Sign In was NOT successful",
        details: error.message,
      }),
    };
  }
};
