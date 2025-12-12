import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider } from "~/components/ui/sidebar";
import { $getSidebarCounts } from "~/lib/api/ideas";
import { $checkMembership, $getOrganizationBySlug } from "~/lib/api/organizations";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug")({
  beforeLoad: async ({ context, params }) => {
    // Look up organization by slug
    const organization = await $getOrganizationBySlug({ data: params.orgSlug });
    if (!organization) {
      throw notFound();
    }

    // Verify user is a member
    const isMember = await $checkMembership({
      data: { organizationId: organization.id, userId: context.user.id },
    });

    if (!isMember) {
      throw redirect({ to: "/dashboard" });
    }

    // Provide organization to child routes via context
    return { organization };
  },
  loader: async ({ params }) => {
    const organization = await $getOrganizationBySlug({ data: params.orgSlug });

    if (!organization) {
      throw notFound();
    }

    return { organization };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { organization } = Route.useLoaderData();
  const { orgSlug } = Route.useParams();

  const { data: counts } = useQuery({
    queryKey: ["sidebar-counts", organization.id],
    queryFn: () => $getSidebarCounts({ data: { organizationId: organization.id } }),
  });

  return (
    <SidebarProvider>
      <AppSidebar counts={counts} orgSlug={orgSlug} />
      <main className="w-full flex-1 overflow-auto">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
