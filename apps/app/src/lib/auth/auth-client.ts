import { polarClient } from "@polar-sh/better-auth";
import { apiKeyClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [organizationClient(), apiKeyClient(), polarClient()],
});
