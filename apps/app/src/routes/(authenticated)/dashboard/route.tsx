import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider } from "~/components/ui/sidebar";
import { $getSidebarCounts } from "~/lib/api/ideas";
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/(authenticated)/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: session } = authClient.useSession();
  const { data: counts } = useQuery({
    queryKey: ["sidebar-counts", session?.session?.activeOrganizationId],
    queryFn: () => $getSidebarCounts(),
  });

  return (
    <SidebarProvider>
      <AppSidebar counts={counts} />
      <main className="w-full flex-1 overflow-auto">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
