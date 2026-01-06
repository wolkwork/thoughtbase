import { ZObject, Bundle, Trigger, defineTrigger } from "zapier-platform-core";

// Subscribe to the webhook - this tells your app to send webhooks to Zapier's URL
const performSubscribe = async (z: ZObject, bundle: Bundle) => {
  const baseUrl = bundle.authData.baseUrl || "https://app.thoughtbase.app";
  const apiKey = bundle.authData.apiKey;

  if (!apiKey) {
    throw new z.errors.Error("API key is required", "ValidationError", 400);
  }

  const webhookUrl = bundle.targetUrl; // Zapier provides this

  try {
    // Subscribe to webhooks for new ideas
    // Organization is automatically determined from the API key
    const response = await z.request({
      method: "POST",
      url: `${baseUrl}/api/zapier/webhooks/subscribe`,
      body: {
        event: "idea.created",
        webhookUrl,
      },
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new z.errors.Error(
        `Failed to subscribe to webhook: ${response.json?.error || "Unknown error"}`,
        "RequestError",
        response.status
      );
    }

    // Return the subscription data - Zapier will store this and pass it to performUnsubscribe
    return {
      id: response.json?.id || response.json?.subscriptionId,
      organizationId: response.json?.organizationId,
      webhookUrl,
    };
  } catch (error) {
    if (error instanceof z.errors.Error) {
      throw error;
    }
    throw new z.errors.Error(
      `Error subscribing to webhook: ${(error as Error).message}`,
      "RequestError",
      500
    );
  }
};

// Unsubscribe from the webhook - this tells your app to stop sending webhooks
const performUnsubscribe = async (z: ZObject, bundle: Bundle) => {
  const baseUrl = bundle.authData.baseUrl || "https://app.thoughtbase.app";
  const apiKey = bundle.authData.apiKey;
  const subscriptionId = bundle.subscribeData?.id;

  if (!subscriptionId) {
    // If we don't have a subscription ID, we can't unsubscribe, but that's okay
    return {};
  }

  if (!apiKey) {
    throw new z.errors.Error("API key is required", "ValidationError", 400);
  }

  try {
    await z.request({
      method: "DELETE",
      url: `${baseUrl}/api/zapier/webhooks/subscribe/${subscriptionId}`,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    return {};
  } catch (error) {
    // Log but don't fail - the subscription might already be deleted
    console.error("Error unsubscribing from webhook:", error);
    return {};
  }
};

// Handle incoming webhook data - this processes the data sent from your app
const perform = async (z: ZObject, bundle: Bundle) => {
  // The webhook data comes in bundle.cleanedRequest
  // Your app should POST JSON data to the webhook URL with the idea data
  const idea = bundle.cleanedRequest;

  // Validate that we have the required fields
  if (!idea || !idea.id) {
    throw new z.errors.Error(
      "Invalid webhook data: missing idea ID",
      "ValidationError",
      400
    );
  }

  // Return the idea data - Zapier will use this as the trigger output
  return [idea];
};

const getFallbackSample = (z: ZObject, bundle: Bundle) => {
  const baseUrl = bundle.authData.baseUrl || "https://app.thoughtbase.app";
  const apiKey = bundle.authData.apiKey;

  if (!apiKey) {
    throw new z.errors.Error("API key is required", "ValidationError", 400);
  }

  return Promise.resolve([
    {
      id: "idea-123",
      title: "Sample Idea",
      description: "This is a sample idea description",
      status: "open",
      organizationId: "org-123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      },
    },
  ]);
};

export default defineTrigger({
  // A key to uniquely identify this trigger
  key: "newIdea",

  // A noun for this trigger that completes the sentence "triggers on a new _____"
  noun: "Idea",

  // Display information about what this trigger does
  display: {
    label: "New Idea",
    description: "Triggers instantly when a new idea is created.",
  },

  // What data appears in the Zapier UI when someone browses this trigger
  operation: {
    // Input fields that the user can provide
    // No input fields needed - organization is determined from API key
    inputFields: [],

    // REST Hook configuration
    type: "hook" as const,

    // Subscribe to the webhook
    performSubscribe,

    // Unsubscribe from the webhook
    performUnsubscribe,

    // Handle incoming webhook data
    perform,

    // Get fallback sample data
    performList: getFallbackSample,

    // What the sample data looks like (for testing)
    sample: {
      id: "idea-123",
      title: "Sample Idea",
      description: "This is a sample idea description",
      status: "open",
      organizationId: "org-123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      },
    },
  },
});
