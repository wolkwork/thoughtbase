import { polarClient } from "@polar-sh/better-auth";
import { apiKeyClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getBaseUrl } from "../base-url";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [organizationClient(), apiKeyClient(), polarClient()],
});
