import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { PublicHeader } from "~/components/public-header";
import { $exchangeSsoToken, getExternalSessionIdFromCookie } from "~/lib/sso-server";

export const Route = createFileRoute("/subdomain/$slug")({
  loaderDeps: ({ search: { sso_token } }: { search: { sso_token?: string } }) => ({
    sso_token,
  }),
  loader: async ({ context, params, deps: { sso_token }, location }) => {
    // Get hostname from request headers for custom domain detection
    const url = new URL(location.url);
    const hostname = url.hostname;

    // If slug is _custom, this is a custom domain request
    // Otherwise, use the slug normally
    const slug = params.slug === "_custom" ? "" : params.slug;

    // Use Convex to get organization (doesn't require auth)
    const convexClient = context.convexQueryClient.convexClient;
    const org = await convexClient.query(
      api.organizations.getOrganizationBySlugOrDomain,
      {
        slug,
        hostname,
      },
    );

    if (!org) {
      throw notFound();
    }

    // Handle SSO token: exchange via server function, set cookie, redirect without sso_token
    if (sso_token && typeof sso_token === "string") {
      try {
        const redirectUrl = new URL(location.url);
        redirectUrl.searchParams.delete("sso_token");
        const redirectPath = redirectUrl.pathname + (redirectUrl.search || "");

        const { redirectTo } = await $exchangeSsoToken({
          data: {
            ssoToken: sso_token,
            organizationId: org._id,
            redirectPath,
          },
        });
        throw redirect({ to: redirectTo, replace: true });
      } catch (error) {
        if (error instanceof Response && error.status === 307) {
          throw error;
        }
        console.error("SSO authentication failed:", error);
      }
    }

    // Read session from cookie via server function (avoids importing server-only getCookie in this file)
    const sessionIdRaw = await getExternalSessionIdFromCookie();
    const sessionId = sessionIdRaw ? (sessionIdRaw as Id<"externalSession">) : undefined;
    const sessionIdForQuery = (sessionId ?? "no-external-session") as
      | Id<"externalSession">
      | "no-external-session";

    // Fetch unified user using convexQuery
    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.getUnifiedUser, { sessionId: sessionIdForQuery }),
    );

    let profile = null;
    if (user) {
      profile = await context.queryClient.ensureQueryData(
        convexQuery(api.auth.getUnifiedProfile, { userId: user._id }),
      );
    }

    return { org, user, profile, sessionId: sessionIdForQuery };
  },
  component: PublicLayout,
});

function PublicLayout() {
  const { org, user, profile, sessionId } = Route.useLoaderData();

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <PublicHeader org={org} user={user} profile={profile} sessionId={sessionId} />
      <Outlet />
    </div>
  );
}
