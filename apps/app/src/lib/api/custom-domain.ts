import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requirePermission } from "~/lib/api/permissions";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member, organization } from "~/lib/db/schema";
import {
  addDomainToVercel,
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

/**
 * Add a domain to Vercel project and save to organization
 * Matches the API expected by the Custom Domain block
 */
export const $addDomain = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      domain: z.string(),
      organizationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    // If organizationId is provided, validate permissions and save to database
    if (data.organizationId) {
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
    }

    await addDomainToVercel(data.domain);

    // Get initial domain status from Vercel
    const { status } = await getDomainStatusFromVercel(data.domain);

    // Update organization with domain
    await db
      .update(organization)
      .set({
        customDomain: data.domain,
        domainVerificationStatus: status,
      })
      .where(eq(organization.id, data.organizationId));

    return status;
  });

/**
 * Get domain status for the Custom Domain block
 * Returns status and DNS records that need to be set
 */
export const $getDomainStatus = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: domain }) => {
    // Check if domain exists in Vercel
    const domainStatus = await getDomainStatusFromVercel(domain);

    if (!domainStatus) {
      return {
        status: "invalid" as const,
        dnsRecordsToSet: undefined,
      };
    }

    return domainStatus;
  });
