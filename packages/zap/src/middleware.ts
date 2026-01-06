import type { ZObject, Bundle } from "zapier-platform-core";

// This function runs before every outbound request to add authentication headers
const addAuthHeaders = (request: any, z: ZObject, bundle: Bundle) => {
  const apiKey = bundle.authData.apiKey;
  const baseUrl = bundle.authData.baseUrl || "https://thoughtbase.app";

  // Ensure the URL is absolute
  if (!request.url.startsWith("http")) {
    request.url = `${baseUrl}${request.url.startsWith("/") ? "" : "/"}${request.url}`;
  }

  // Add API key header
  request.headers = request.headers || {};
  request.headers["x-api-key"] = apiKey;
  request.headers["Content-Type"] = "application/json";

  return request;
};

// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const handleBadResponses = (response: any, z: ZObject, bundle: Bundle) => {
  if (response.status === 401) {
    throw new z.errors.Error(
      "The API key you supplied is incorrect or has expired",
      "AuthenticationError",
      response.status
    );
  }

  if (response.status === 403) {
    throw new z.errors.Error(
      "You do not have permission to access this resource",
      "AuthorizationError",
      response.status
    );
  }

  if (response.status >= 400) {
    const errorMessage =
      response.json?.error || response.json?.message || `Request failed with status ${response.status}`;
    throw new z.errors.Error(errorMessage, "RequestError", response.status);
  }

  return response;
};

export const befores = [addAuthHeaders];

export const afters = [handleBadResponses];
