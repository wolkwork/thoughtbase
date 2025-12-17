import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_VERCEL_BRANCH_URL: z.string().default("localhost:3000"),
  },
  runtimeEnv: import.meta.env,
});
