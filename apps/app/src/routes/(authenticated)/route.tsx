import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authQueryOptions } from "~/lib/auth/queries";

export const Route = createFileRoute("/(authenticated)")({
  component: Outlet,
  beforeLoad: async ({ context, location }) => {
    const sessionData = await context.queryClient.ensureQueryData({
      ...authQueryOptions(),
      revalidateIfStale: true,
    });
    if (!sessionData) {
      throw redirect({ to: "/login" });
    }

    if (
      !sessionData.session.activeOrganizationId &&
      !location.pathname.startsWith("/onboarding")
    ) {
      throw redirect({ to: "/onboarding" });
    }

    // re-return to update type as non-null for child routes
    return { user: sessionData.user, session: sessionData.session };
  },
});
