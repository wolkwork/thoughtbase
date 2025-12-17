import { env } from "~/env/server";

export function getBaseUrl() {
  const protocol = env.VERCEL_ENV === "development" ? "http" : "https";

  return `${protocol}://${env.VERCEL_BRANCH_URL}`;
}
