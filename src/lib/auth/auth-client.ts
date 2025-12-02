import { apiKeyClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
import { env } from "~/env/client";

export const authClient = createAuthClient({
  baseURL: env.VITE_BASE_URL,
  plugins: [organizationClient(), apiKeyClient(), polarClient()],
});
