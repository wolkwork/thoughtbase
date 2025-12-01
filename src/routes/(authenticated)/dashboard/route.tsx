import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { $getSidebarCounts } from "~/lib/api/ideas";

export const Route = createFileRoute("/(authenticated)/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: counts } = useQuery({
    queryKey: ["sidebar-counts"],
    queryFn: () => $getSidebarCounts(),
  });

  return (
    <SidebarProvider>
      <AppSidebar counts={counts} />
      <main className="flex-1 overflow-auto w-full">
        <div className="p-4">
            <SidebarTrigger />
        </div>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
