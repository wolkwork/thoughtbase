import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/")({
  beforeLoad: async ({ params }) => {
    throw redirect({
      to: "/dashboard/$orgSlug/ideas",
      params: { orgSlug: params.orgSlug },
    });
  },
});
