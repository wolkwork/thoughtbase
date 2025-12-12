import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member, organization } from "~/lib/db/schema";

async function getAuthContext() {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
  });

  return {
    user: session?.user || null,
    session: session?.session || null,
  };
}

export const $getOrganizationBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: slug }) => {
    // TODO: Maybe use better auth client for this? https://www.better-auth.com/docs/plugins/organization#get-full-organization
    const org = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    });

    return org;
  });

// TODO: Potentially this can be cached
export const $checkMembership = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      userId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const memberRecord = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, data.organizationId),
        eq(member.userId, data.userId),
      ),
    });
    return !!memberRecord;
  });

export const $generateOrgSecret = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const memberRecord = await db.query.member.findFirst({
      where: and(
        eq(member.userId, ctx.user.id),
        eq(member.organizationId, data.organizationId),
      ),
    });

    if (
      !memberRecord ||
      (memberRecord.role !== "admin" && memberRecord.role !== "owner")
    ) {
      throw new Error("Insufficient permissions");
    }

    const secret = nanoid(32);

    await db
      .update(organization)
      .set({ secret })
      .where(eq(organization.id, data.organizationId));

    return { secret };
  });

export const $getOrgSecret = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const memberRecord = await db.query.member.findFirst({
      where: and(
        eq(member.userId, ctx.user.id),
        eq(member.organizationId, data.organizationId),
      ),
    });

    if (
      !memberRecord ||
      (memberRecord.role !== "admin" && memberRecord.role !== "owner")
    ) {
      throw new Error("Insufficient permissions");
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
      columns: {
        secret: true,
      },
    });

    return { secret: org?.secret };
  });
