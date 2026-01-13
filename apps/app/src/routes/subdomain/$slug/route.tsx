import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { PublicHeader } from "~/components/public-header";
import { $signInWithSSO } from "~/lib/api/sso";
import { $getUnifiedProfile, $getUnifiedUser } from "~/lib/auth/unified-auth-functions";
import { $getOrganizationBySlugOrDomain, $getPlanPermissions } from "~/lib/domains";

// Known base domains for subdomain detection (must match router.tsx)

export const Route = createFileRoute("/subdomain/$slug")({
  loaderDeps: ({ search: { sso_token } }: { search: { sso_token?: string } }) => ({
    sso_token,
  }),
  loader: async ({ params, deps: { sso_token }, location }) => {
    // Get hostname from request headers for custom domain detection
    const url = new URL(location.url);
    const hostname = url.hostname;

    // If slug is _custom, this is a custom domain request
    // Otherwise, use the slug normally
    const slug = params.slug === "_custom" ? "" : params.slug;

    console.log("FETCHING", { slug: params.slug, hostname });

    const org = await $getOrganizationBySlugOrDomain({
      data: { slug, hostname },
    });

    if (!org) {
      throw notFound();
    }

    // Handle SSO token from query parameter
    if (sso_token && typeof sso_token === "string") {
      try {
        await $signInWithSSO({
          data: {
            token: sso_token,
            organizationId: org.id,
          },
        });

        const url = new URL(location.url);
        // Remove the sso_token query parameter
        url.searchParams.delete("sso_token");
        // Redirect to the same URL without the sso_token parameter
        throw redirect({
          to: url.pathname + (url.search ? url.search : ""),
          replace: true,
        });
      } catch (error) {
        // If it's a redirect, re-throw it
        if (error instanceof Response && error.status === 307) {
          throw error;
        }
        // Otherwise, log the error but continue (user will be unauthenticated)
        console.error("SSO authentication failed:", error);
      }
    }

    // Fetch unified user and profile to support both internal and external users
    const user = await $getUnifiedUser();
    let profile = null;

    if (user) {
      profile = await $getUnifiedProfile({ data: { organizationId: org.id } });
    }

    const plan = await $getPlanPermissions({ data: { organizationId: org.id } });

    return { org, user, profile, plan };
  },
  component: PublicLayout,
});

function PublicLayout() {
  const { org, user, profile } = Route.useLoaderData();

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <PublicHeader org={org} user={user} profile={profile} />
      <Outlet />
    </div>
  );
}
