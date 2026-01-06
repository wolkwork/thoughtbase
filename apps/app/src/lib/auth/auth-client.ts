import { polarClient } from "@polar-sh/better-auth";
import { apiKeyClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function getBaseUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://thoughtbase.localhost:3000";
  }

  return "https://thoughtbase.app";
}

export const authClient = createAuthClient({
  plugins: [organizationClient(), apiKeyClient(), polarClient()],
  baseURL: getBaseUrl(),
});
