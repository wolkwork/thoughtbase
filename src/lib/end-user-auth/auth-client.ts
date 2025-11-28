import { createAuthClient } from "better-auth/react";
import { env } from "~/env/client";

export const endUserAuthClient = createAuthClient({
  baseURL: env.VITE_BASE_URL,
  basePath: "/api/auth/end-user",
});

