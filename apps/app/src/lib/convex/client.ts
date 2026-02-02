import { api, components } from "@thoughtbase/backend/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { env } from "~/env/client";

// Create a Convex HTTP client for server-side usage
let convexClient: ConvexHttpClient | null = null;

export function getConvexClient() {
  if (!convexClient) {
    convexClient = new ConvexHttpClient(env.VITE_CONVEX_URL);
  }
  return convexClient;
}

export { api, components };
