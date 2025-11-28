import { createAuthClient } from "better-auth/react";
import { env } from "~/env/client";

export const platformAuthClient = createAuthClient({
  baseURL: env.VITE_BASE_URL,
  basePath: "/api/auth/platform",
});

