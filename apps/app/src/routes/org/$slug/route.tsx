import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { $signInWithSSO } from "~/lib/api/sso";
import { $getUnifiedProfile, $getUnifiedUser } from "~/lib/auth/unified-auth-functions";
import { db } from "~/lib/db";
import { organization } from "~/lib/db/schema";

const getOrganization = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const org = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    });
    if (!org) {
      throw notFound();
    }
    return org;
  });

export const Route = createFileRoute("/org/$slug")({
  loaderDeps: ({ search: { sso_token } }) => ({ sso_token }),
  loader: async ({ params, deps: { sso_token }, location }) => {
    const org = await getOrganization({ data: params.slug });
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

    return { org, user, profile };
  },
  component: () => <Outlet />,
});
