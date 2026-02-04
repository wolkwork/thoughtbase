import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { SessionProvider } from "convex-helpers/react/sessions";
import { PublicHeader } from "~/components/public-header";

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

    // Use Convex to get organization
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

    let sessionId: Id<"externalSession"> | undefined = undefined;

    // Handle SSO token from query parameter
    if (sso_token && typeof sso_token === "string") {
      try {
        const session = await convexClient.mutation(api.externalSessions.signInWithSSO, {
          ssoToken: sso_token,
          organizationId: org._id,
        });

        sessionId = session?._id;

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
    const user = await convexClient.query(api.auth.getUnifiedUser, {
      sessionId: sessionId ?? "no-external-session",
    });

    let profile = null;

    if (user) {
      profile = await convexClient.query(api.auth.getUnifiedProfile, {
        userId: user._id,
      });
    }

    return { org, user, profile, sessionId };
  },
  component: PublicLayout,
});

function PublicLayout() {
  const { org, user, profile, sessionId } = Route.useLoaderData();

  return (
    <SessionProvider
      storageKey="thoughtbase-sso-token"
      ssrFriendly
      idGenerator={() => sessionId ?? "no-external-session"}
    >
      <div className="bg-background text-foreground relative flex min-h-screen flex-col">
        <PublicHeader org={org} user={user} profile={profile} />
        <Outlet />
      </div>
    </SessionProvider>
  );
}
