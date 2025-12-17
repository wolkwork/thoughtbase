import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { authClient } from "~/lib/auth/auth-client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/(auth-pages)")({
  component: RouteComponent,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const redirectUrl = search.redirect || "/dashboard";

    const { data: session } = await authClient.getSession();

    if (session?.user) {
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
