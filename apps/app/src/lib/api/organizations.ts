import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { verifyDomainDNS } from "~/lib/api/domain-verification";
import { requirePermission } from "~/lib/api/permissions";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member, organization } from "~/lib/db/schema";
import { Permission } from "~/plans";

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

export const $setCustomDomain = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      domain: z.string().min(1).max(255),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    await requirePermission(data.organizationId, Permission.CUSTOM_DOMAIN);

    // Check user is admin/owner
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

    // Get organization to access slug
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
      columns: {
        slug: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Generate verification token
    const verificationToken = nanoid(32);

    // Update organization with domain and token
    await db
      .update(organization)
      .set({
        customDomain: data.domain,
        domainVerificationToken: verificationToken,
        domainVerificationStatus: "pending",
        domainVerifiedAt: null,
      })
      .where(eq(organization.id, data.organizationId));

    return {
      domain: data.domain,
      verificationToken,
      status: "pending" as const,
    };
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
        domainVerificationToken: true,
        domainVerifiedAt: true,
        domainVerificationStatus: true,
        slug: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    return {
      domain: org.customDomain,
      verificationToken: org.domainVerificationToken,
      verifiedAt: org.domainVerifiedAt,
      status: org.domainVerificationStatus as "pending" | "verified" | "failed" | null,
      orgSlug: org.slug,
    };
  });

export const $verifyDomain = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    await requirePermission(data.organizationId, Permission.CUSTOM_DOMAIN);

    // Check user is admin/owner
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

    // Get organization domain info
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
      columns: {
        customDomain: true,
        domainVerificationToken: true,
        slug: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    if (!org.customDomain || !org.domainVerificationToken) {
      throw new Error("No custom domain configured");
    }

    // Verify DNS records
    const verificationResult = await verifyDomainDNS(
      org.customDomain,
      org.slug,
      org.domainVerificationToken,
    );

    // Update verification status
    const status = verificationResult.verified ? "verified" : "failed";
    const verifiedAt = verificationResult.verified ? new Date() : null;

    await db
      .update(organization)
      .set({
        domainVerificationStatus: status,
        domainVerifiedAt: verifiedAt,
      })
      .where(eq(organization.id, data.organizationId));

    return {
      verified: verificationResult.verified,
      cnameVerified: verificationResult.cnameVerified,
      txtVerified: verificationResult.txtVerified,
      errors: verificationResult.errors,
      status,
      verifiedAt,
    };
  });
