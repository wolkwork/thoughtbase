import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider } from "~/components/ui/sidebar";
import { useOrganization } from "~/hooks/organization";

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

    const isMember = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.checkMembership, {
        organizationId: organization._id,
        userId: context.user._id,
      }),
    );

    if (!isMember) {
      throw redirect({ to: "/dashboard" });
    }

    context.convexQueryClient.serverHttpClient?.action(api.permissions.refreshCustomer, {
      organizationId: organization._id,
    });

    return { organization };
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
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
