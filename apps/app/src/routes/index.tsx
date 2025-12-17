import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    throw redirect({ to: "/dashboard" });
  },
  loader: () => {
    return {
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };
  },
});
