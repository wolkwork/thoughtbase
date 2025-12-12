import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authQueryOptions } from "~/lib/auth/queries";

export const Route = createFileRoute("/(authenticated)")({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    const sessionData = await context.queryClient.ensureQueryData({
      ...authQueryOptions(),
      revalidateIfStale: true,
    });
    if (!sessionData) {
      throw redirect({ to: "/login" });
    }

    // Organization context now comes from URL ($orgSlug param)
    // The $orgSlug route handles membership validation
    return { user: sessionData.user, session: sessionData.session };
  },
});
