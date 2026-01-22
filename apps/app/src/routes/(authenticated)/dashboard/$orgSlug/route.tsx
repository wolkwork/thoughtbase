import { api } from "@/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { AppSidebar } from "~/components/app-sidebar";
import { TrialStatusBanner } from "~/components/trial-status-banner";
import { SidebarProvider } from "~/components/ui/sidebar";
import { $getSidebarCounts } from "~/lib/api/ideas";
import { getPlanPermissions } from "~/lib/api/permissions";
import { plans } from "~/plans";

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
    const organization = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.getOrganizationBySlug, {
        slug: params.orgSlug,
      }),
    );

    if (!organization) {
      throw notFound();
    }

    console.log(organization);

    // const isMember = await $checkMembership({
    //   data: { organizationId: organization.id, userId: context.user.id },
    // });

    const isMember = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.checkMembership, {
        organizationId: organization._id,
        userId: context.user._id,
      }),
    );

    if (!isMember) {
      throw redirect({ to: "/dashboard" });
    }

    // const plan = await $getPlanPermissions({ data: { organizationId: organization.id } });

    // Provide organization and permissions to child routes via context
    return { organization, plan: plans.business };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { orgSlug } = Route.useParams();

  const { data: organization } = useSuspenseQuery(
    convexQuery(api.auth.getOrganizationBySlug, { slug: orgSlug }),
  );

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
