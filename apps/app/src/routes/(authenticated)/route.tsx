import { api } from "@/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(authenticated)")({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.getCurrentUser, {}),
    );

    if (!user) {
      throw redirect({ to: "/login" });
    }

    // Organization context now comes from URL ($orgSlug param)
    // The $orgSlug route handles membership validation
    return { user };
  },
});
