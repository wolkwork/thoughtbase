import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { AppSidebar } from "~/components/app-sidebar";
import { TrialStatusBanner } from "~/components/trial-status-banner";
import { SidebarProvider } from "~/components/ui/sidebar";
import { useOrganization } from "~/hooks/organization";
import { SubscriptionTier } from "~/lib/api/permissions";
import { plans } from "~/plans";

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
    return { organization, plan: plans.business as (typeof plans)[SubscriptionTier] };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { orgSlug } = Route.useParams();

  const organization = useOrganization();

  const { data: counts } = useQuery(
    convexQuery(api.ideas.getSidebarCounts, {
      organizationId: organization._id,
    }),
  );

  return (
    <SidebarProvider>
      <AppSidebar
        counts={counts as Record<string, number> | undefined}
        orgSlug={orgSlug}
      />
      <main className="w-full flex-1 overflow-auto">
        <TrialStatusBanner />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
