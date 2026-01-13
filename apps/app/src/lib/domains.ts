import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { parse } from "tldts";
import z from "zod";
import { $getOrganizationByCustomDomain } from "./api/organizations";
import { getPlanPermissions } from "./api/permissions";
import { db } from "./db";
import { organization } from "./db/schema";

const BASE_DOMAINS = ["thoughtbase.app", "thoughtbase.localhost"] as const;

/**
 * Check if a hostname is a custom domain (not a base domain or subdomain)
 */
function isCustomDomain(hostname: string): boolean {
  const parsed = parse(hostname);
  const domain = parsed.domain;

  // If domain matches a known base domain, it's not a custom domain
  if (domain && BASE_DOMAINS.includes(domain as (typeof BASE_DOMAINS)[number])) {
    return false;
  }

  // Otherwise, it's a custom domain
  return true;
}

/**
 * Get organization by slug or custom domain
 * Checks custom domain first if hostname doesn't match base domains
 */
export const $getOrganizationBySlugOrDomain = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      slug: z.string().optional(),
      hostname: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // If hostname is provided and is a custom domain, try custom domain lookup
    if (data.hostname && isCustomDomain(data.hostname)) {
      const orgByDomain = await $getOrganizationByCustomDomain({
        data: data.hostname,
      });

      if (orgByDomain) {
        return orgByDomain;
      }
    }

    // Fall back to slug lookup (only if slug is provided)
    if (!data.slug) {
      throw notFound();
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.slug, data.slug),
    });
    if (!org) {
      throw notFound();
    }
    return org;
  });

/**
 * Server function to get plan permissions for use in route loaders
 */
export const $getPlanPermissions = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    return await getPlanPermissions(data.organizationId);
  });
