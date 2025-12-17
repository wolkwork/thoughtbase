export function getBaseUrl() {
  const protocol = import.meta.env.VITE_VERCEL_ENV === "development" ? "http" : "https";

  return `${protocol}://${import.meta.env.VITE_VERCEL_BRANCH_URL}`;
}
