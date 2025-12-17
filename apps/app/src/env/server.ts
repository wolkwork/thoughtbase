import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    VERCEL_BRANCH_URL: z.string(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string(),
    VERCEL_ENV: z.string().default("development"),
    BETTER_AUTH_SECRET: z.string().min(1),

    // OAuth2 providers, optional, update as needed
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),

    POLAR_STARTER_ID: z.string().min(1),
    POLAR_GROWTH_ID: z.string().min(1),

    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});
