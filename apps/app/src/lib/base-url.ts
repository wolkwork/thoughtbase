import { env } from "~/env/server";

export function getBaseUrl() {
  const protocol = env.VERCEL_ENV === "development" ? "http" : "https";

  console.log(env.VERCEL_ENV);

  return `${protocol}://${env.VERCEL_ENV === "production" ? "thoughtbase.app" : env.VERCEL_BRANCH_URL}`;
}
