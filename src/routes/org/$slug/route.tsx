import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
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
  loader: async ({ params }) => {
    const org = await getOrganization({ data: params.slug });
    if (!org) {
      throw notFound();
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
