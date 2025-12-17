import { env } from "~/env/server";

export function getBaseUrl() {
  const protocol = env.VERCEL_ENV === "development" ? "http" : "https";

  return `${protocol}://${env.VERCEL_ENV === "production" ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_BRANCH_URL}`;
}
