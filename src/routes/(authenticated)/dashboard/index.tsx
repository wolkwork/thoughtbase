import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSwitcher } from "~/components/organization-switcher";
import { SignOutButton } from "~/components/sign-out-button";

export const Route = createFileRoute("/(authenticated)/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = Route.useRouteContext();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <OrganizationSwitcher />
      </div>

      <div className="flex flex-col items-center gap-1">
        Dashboard index page
        <pre className="bg-card text-card-foreground rounded-md border p-1 text-xs">
          routes/(authenticated)dashboard/index.tsx
        </pre>
        <div className="mt-2 text-center text-xs sm:text-sm">
          User data from route context:
          <pre className="max-w-screen overflow-x-auto px-2 text-start">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
