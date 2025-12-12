import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/(auth-pages)")({
  component: RouteComponent,
  beforeLoad: async () => {
    const REDIRECT_URL = "/dashboard";

    const { data: session } = await authClient.getSession();

    if (session?.user) {
      throw redirect({
        to: REDIRECT_URL,
      });
    }

    return {
      redirectUrl: REDIRECT_URL,
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
