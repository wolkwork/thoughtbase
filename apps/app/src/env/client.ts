import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    VITE_CONVEX_URL: z.string(),
  },
  clientPrefix: "VITE_",
  runtimeEnv: {
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
  },
});
