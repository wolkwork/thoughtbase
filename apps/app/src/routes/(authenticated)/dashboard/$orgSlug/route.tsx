import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { AppSidebar } from "~/components/app-sidebar";
import { TrialStatusBanner } from "~/components/trial-status-banner";
import { SidebarProvider } from "~/components/ui/sidebar";
import { $getSidebarCounts } from "~/lib/api/ideas";
import { $checkMembership, $getOrganizationBySlug } from "~/lib/api/organizations";
import { getPlanPermissions } from "~/lib/api/permissions";

/**
 * Server function to get plan permissions for use in route loaders
 */
export const $getPlanPermissions = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    return await getPlanPermissions(data.organizationId);
  });

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug")({
  beforeLoad: async ({ context, params }) => {
    console.time("[ORG_ROUTE_BEFORELOAD] Total beforeLoad time");

    console.time("[ORG_ROUTE_BEFORELOAD] Get organization by slug");
    const organization = await $getOrganizationBySlug({ data: params.orgSlug });
    console.timeEnd("[ORG_ROUTE_BEFORELOAD] Get organization by slug");

    if (!organization) {
      throw notFound();
    }

    console.time("[ORG_ROUTE_BEFORELOAD] Check membership");
    const isMember = await $checkMembership({
      data: { organizationId: organization.id, userId: context.user.id },
    });
    console.timeEnd("[ORG_ROUTE_BEFORELOAD] Check membership");

    if (!isMember) {
      throw redirect({ to: "/dashboard" });
    }

    console.time("[ORG_ROUTE_BEFORELOAD] Get plan permissions");
    const plan = await $getPlanPermissions({ data: { organizationId: organization.id } });
    console.timeEnd("[ORG_ROUTE_BEFORELOAD] Get plan permissions");

    console.timeEnd("[ORG_ROUTE_BEFORELOAD] Total beforeLoad time");

    // Provide organization and permissions to child routes via context
    return { organization, plan };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { organization } = Route.useRouteContext();
  const { orgSlug } = Route.useParams();

  const { data: counts } = useQuery({
    queryKey: ["sidebar-counts", organization.id],
    queryFn: () => $getSidebarCounts({ data: { organizationId: organization.id } }),
  });

  return (
    <SidebarProvider>
      <AppSidebar counts={counts} orgSlug={orgSlug} />
      <main className="w-full flex-1 overflow-auto">
        <TrialStatusBanner />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
