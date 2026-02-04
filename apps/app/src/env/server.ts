import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    VITE_CONVEX_URL: z.string(),

    DATABASE_URL: z.url(),
    VERCEL_BRANCH_URL: z.string(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string(),
    VERCEL: z.string().default("0"),
    VERCEL_ENV: z.string().default("development"),
    BETTER_AUTH_SECRET: z.string().min(1),

    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1),

    // Vercel for Platforms
    VERCEL_TOKEN: z.string().min(1),
    VERCEL_PROJECT_ID: z.string().min(1),
    VERCEL_TEAM_ID: z.string().optional(),
    VERCEL_TEAM_SLUG: z.string().optional(),
  },
  runtimeEnv: process.env,
});
