import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member, organization } from "~/lib/db/schema";
import { getDomainStatusFromVercel } from "~/lib/vercel/domains";

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

/**
 * Get organization by custom domain (only returns verified domains)
 */
export const $getOrganizationByCustomDomain = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: hostname }) => {
    const org = await db.query.organization.findFirst({
      where: and(
        eq(organization.customDomain, hostname),
        eq(organization.domainVerificationStatus, "verified"),
      ),
    });

    return org;
  });

/**
 * Check if an origin URL is a verified custom domain
 * Returns true if the origin's hostname matches a verified custom domain
 */
export const $isVerifiedCustomDomain = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: origin }) => {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      const org = await db.query.organization.findFirst({
        where: and(
          eq(organization.customDomain, hostname),
          eq(organization.domainVerificationStatus, "verified"),
        ),
        columns: { id: true },
      });

      return !!org;
    } catch {
      return false;
    }
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

export const $getCustomDomainStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    // Check user is member
    const memberRecord = await db.query.member.findFirst({
      where: and(
        eq(member.userId, ctx.user.id),
        eq(member.organizationId, data.organizationId),
      ),
    });

    if (!memberRecord) {
      throw new Error("Unauthorized");
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
      columns: {
        customDomain: true,
        domainVerifiedAt: true,
        domainVerificationStatus: true,
        slug: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // If no domain is configured, return early
    if (!org.customDomain) {
      return {
        domain: null,
        verifiedAt: null,
        status: null as "pending" | "verified" | "failed" | null,
        orgSlug: org.slug,
        verification: undefined,
        nameservers: undefined,
      };
    }

    // Get current status from Vercel (includes nameservers)
    const vercelDomain = await getDomainStatusFromVercel(org.customDomain);

    // Sync status with database if it changed
    if (org.domainVerificationStatus !== vercelDomain.status) {
      await db
        .update(organization)
        .set({
          domainVerificationStatus: vercelDomain.status,
          domainVerifiedAt: vercelDomain.status === "verified" ? new Date() : null,
        })
        .where(eq(organization.id, data.organizationId));
    }

    return vercelDomain;
  });
