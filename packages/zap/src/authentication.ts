import type { ZObject, Bundle, Authentication } from "zapier-platform-core";

// Test authentication by making a request to verify the API key works
const test = async (z: ZObject, bundle: Bundle) => {
  const baseUrl = bundle.authData.baseUrl || "https://thoughtbase.app";
  const apiKey = bundle.authData.apiKey;

  try {
    // Try to fetch user info or a simple endpoint to verify the API key
    const response = await z.request({
      method: "GET",
      url: `${baseUrl}/api/auth/session`,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      throw new z.errors.Error("Invalid API key", "AuthenticationError", response.status);
    }

    return response.json;
  } catch (error) {
    if (error instanceof z.errors.Error) {
      throw error;
    }
    throw new z.errors.Error(
      "Failed to authenticate. Please check your API key and base URL.",
      "AuthenticationError",
      401
    );
  }
};

export default {
  // Custom authentication using API key
  type: "custom",

  // Define input fields for authentication
  fields: [
    {
      key: "apiKey",
      label: "API Key",
      type: "string",
      required: true,
      helpText: "Your Thoughtbase API key. You can create one in your account settings.",
    },
    {
      key: "baseUrl",
      label: "Base URL",
      type: "string",
      required: false,
      default: "https://thoughtbase.app",
      helpText: "The base URL for your Thoughtbase instance. Defaults to https://thoughtbase.app",
    },
  ],

  // The test method allows Zapier to verify that the credentials a user provides
  // are valid. We'll execute this method whenever a user connects their account for
  // the first time.
  test,

  // Connection label to display in Zapier
  connectionLabel: "Thoughtbase API",
} satisfies Authentication;
