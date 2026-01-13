import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requirePermission } from "~/lib/api/permissions";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member, organization } from "~/lib/db/schema";
import {
  addDomainToVercel,
  getDomainConfigFromVercel,
  getDomainStatusFromVercel,
  removeDomainFromVercel,
} from "~/lib/vercel/domains";
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

    // Get organization
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
      columns: {
        slug: true,
        customDomain: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // If there's an existing domain, remove it from Vercel first
    if (org.customDomain && org.customDomain !== data.domain) {
      try {
        await removeDomainFromVercel(org.customDomain);
      } catch (error) {
        // Log but don't fail - domain might not exist in Vercel
        console.error("Failed to remove existing domain from Vercel:", error);
      }
    }

    // Add domain to Vercel project
    try {
      await addDomainToVercel(data.domain);
    } catch (error: unknown) {
      // If domain already exists, that's okay - continue
      if (error && typeof error === "object" && "status" in error) {
        if (error.status !== 409) {
          const message =
            "message" in error && typeof error.message === "string"
              ? error.message
              : "Unknown error";
          throw new Error(`Failed to add domain to Vercel: ${message}`);
        }
      } else {
        throw new Error(
          `Failed to add domain to Vercel: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Get initial domain status from Vercel
    const vercelStatus = await getDomainStatusFromVercel(data.domain);

    // Update organization with domain
    await db
      .update(organization)
      .set({
        customDomain: data.domain,
        domainVerificationToken: null, // No longer needed with Vercel
        domainVerificationStatus: vercelStatus?.verified ? "verified" : "pending",
        domainVerifiedAt: vercelStatus?.verified ? new Date() : null,
      })
      .where(eq(organization.id, data.organizationId));

    return {
      domain: data.domain,
      status: vercelStatus?.verified ? ("verified" as const) : ("pending" as const),
      verification: vercelStatus?.verification,
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
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    if (!org.customDomain) {
      throw new Error("No custom domain configured");
    }

    // Get domain config which includes verification status and DNS records
    const vercelStatus = await getDomainConfigFromVercel(org.customDomain);

    if (!vercelStatus) {
      throw new Error("Domain not found in Vercel");
    }

    const verificationResult = {
      verified: vercelStatus.verified,
      verification: vercelStatus.verification,
    };

    // Update verification status
    const status = verificationResult.verified ? "verified" : "pending";
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
      status,
      verifiedAt,
      verification: verificationResult.verification,
      nameservers: vercelStatus?.nameservers,
    };
  });
