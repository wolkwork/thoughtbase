import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/(auth-pages)")({
  component: RouteComponent,
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const redirectUrl = search.redirect || "/dashboard";

    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.getSafeCurrentUser, {}),
    );

    if (user) {
      throw redirect({
        to: redirectUrl,
      });
    }

    return {
      redirectUrl,
    };
  },
});

function RouteComponent() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
