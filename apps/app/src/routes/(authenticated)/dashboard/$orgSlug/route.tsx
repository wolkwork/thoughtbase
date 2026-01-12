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

    // Fetch permissions during SSR
    const plan = await $getPlanPermissions({ data: { organizationId: organization.id } });

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
