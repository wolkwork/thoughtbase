import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { organization } from "~/lib/db/schema";

async function getAuthContext() {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
  });

  return {
    user: session?.user || null,
    session: session?.session || null,
    organizationId: session?.session?.activeOrganizationId || null,
  };
}

export const $generateOrgSecret = createServerFn({ method: "POST" }).handler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.user || !ctx.organizationId) {
    throw new Error("Unauthorized or no active organization");
  }

  const member = await db.query.member.findFirst({
    where: (member, { and, eq }) =>
      and(
        eq(member.userId, ctx.user!.id),
        eq(member.organizationId, ctx.organizationId!),
      ),
  });

  if (!member || (member.role !== "admin" && member.role !== "owner")) {
    throw new Error("Insufficient permissions");
  }

  const secret = nanoid(32);

  await db
    .update(organization)
    .set({ secret })
    .where(eq(organization.id, ctx.organizationId));

  return { secret };
});

export const $getOrgSecret = createServerFn({ method: "GET" }).handler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.user || !ctx.organizationId) {
    throw new Error("Unauthorized or no active organization");
  }

  const member = await db.query.member.findFirst({
    where: (member, { and, eq }) =>
      and(
        eq(member.userId, ctx.user!.id),
        eq(member.organizationId, ctx.organizationId!),
      ),
  });

  if (!member || (member.role !== "admin" && member.role !== "owner")) {
    throw new Error("Insufficient permissions");
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, ctx.organizationId),
    columns: {
      secret: true,
    },
  });

  return { secret: org?.secret };
});
