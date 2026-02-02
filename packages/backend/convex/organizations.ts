import { v } from "convex/values";
import { nanoid } from "nanoid";
import { components } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { api } from "./_generated/api";

/**
 * Get organization by ID (public, for SSO verification)
 * Note: This is a public wrapper around the internal betterAuth function
 */
export const getOrganizationById = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationById,
      {
        id: args.organizationId,
      },
    );

    return organization;
  },
});

/**
 * Get organization by slug or custom domain
 * Checks custom domain first if hostname doesn't match base domains
 */
export const getOrganizationBySlugOrDomain = query({
  args: {
    slug: v.optional(v.string()),
    hostname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If hostname is provided, try custom domain lookup first
    if (args.hostname) {
      const orgByDomain = await ctx.runQuery(
        components.betterAuth.functions.getOrganizationByCustomDomain,
        {
          customDomain: args.hostname,
        },
      );

      if (orgByDomain && orgByDomain.domainVerificationStatus === "verified") {
        return {
          id: orgByDomain._id,
          name: orgByDomain.name,
          slug: orgByDomain.slug,
          logo: orgByDomain.logo || null,
          customDomain: orgByDomain.customDomain || null,
        };
      }
    }

    // Fall back to slug lookup (only if slug is provided)
    if (!args.slug) {
      return null;
    }

    const org = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationBySlug,
      {
        slug: args.slug,
      },
    );

    if (!org) {
      return null;
    }

    return {
      id: org._id,
      name: org.name,
      slug: org.slug,
      logo: org.logo || null,
      customDomain: org.customDomain || null,
    };
  },
});

/**
 * Get organization secret (SSO secret)
 */
export const getOrgSecret = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check user is a member with admin/owner role
    const member = await ctx.runQuery(
      components.betterAuth.functions.checkMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      },
    );

    if (!member) {
      throw new Error("Unauthorized");
    }

    // Get member record to check role
    const memberRecord = await ctx.runQuery(
      components.betterAuth.functions.getMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      },
    );

    if (
      !memberRecord ||
      (memberRecord.role !== "admin" && memberRecord.role !== "owner")
    ) {
      throw new Error("Insufficient permissions");
    }

    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationById,
      {
        id: args.organizationId,
      },
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    return { secret: organization.secret || null };
  },
});

/**
 * Generate a new organization secret (SSO secret)
 */
export const generateOrgSecret = mutation({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check user is a member with admin/owner role
    const memberRecord = await ctx.runQuery(
      components.betterAuth.functions.getMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      },
    );

    if (
      !memberRecord ||
      (memberRecord.role !== "admin" && memberRecord.role !== "owner")
    ) {
      throw new Error("Insufficient permissions");
    }

    const secret = nanoid(32);

    // Update organization secret in betterAuth component
    await ctx.runMutation(
      components.betterAuth.functions.updateOrganizationSecret,
      {
        id: args.organizationId,
        secret,
      },
    );

    return { secret };
  },
});

/**
 * Get plan permissions for an organization
 * For public pages, this returns the free plan by default
 * TODO: Integrate with Polar API to get actual subscription tier
 */
export const getPlanPermissions = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, return free plan for public pages
    // TODO: Integrate with Polar API via HTTP action to get actual subscription
    return {
      slug: "free",
      name: "Free",
      hidden: true,
      price: {
        month: 0,
        year: 0,
      },
      permissions: ["read"],
    };
  },
});

const blacklistedApexDomains = ["thoughtbase.app"];

/**
 * Add a domain to Vercel project and save to organization
 * Matches the API expected by the Custom Domain block
 */
export const addDomain = action({
  args: {
    domain: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    if (blacklistedApexDomains.some((apex) => args.domain.includes(apex))) {
      throw new Error("That's ours!");
    }

    // Get current authenticated user
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    await ctx.runQuery(api.permissions.requirePermission, {
      organizationId: args.organizationId,
      permission: "custom-domain",
    });

    // Check user is admin/owner
    const memberRecord = await ctx.runQuery(
      components.betterAuth.functions.getMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      },
    );

    if (
      !memberRecord ||
      (memberRecord.role !== "admin" && memberRecord.role !== "owner")
    ) {
      throw new Error("Insufficient permissions");
    }

    // Get organization
    const org = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationById,
      {
        id: args.organizationId,
      },
    );

    if (!org) {
      throw new Error("Organization not found");
    }

    // If there's an existing domain, remove it from Vercel first
    if (org.customDomain && org.customDomain !== args.domain) {
      try {
        await ctx.runAction(api.vercel.removeDomainFromVercel, {
          domain: org.customDomain,
        });
      } catch (error) {
        // Log but don't fail - domain might not exist in Vercel
        console.error("Failed to remove existing domain from Vercel:", error);
      }
    }

    // Add domain to Vercel
    await ctx.runAction(api.vercel.addDomainToVercel, {
      domain: args.domain,
    });

    // Get initial domain status from Vercel
    await ctx.runAction(api.vercel.refreshDomainStatusFromVercel, {
      domain: args.domain,
      organizationId: args.organizationId,
    });
  },
});

/**
 * Get domain status for the Custom Domain block
 * Returns status and DNS records that need to be set
 */
export const refreshDomainStatus = action({
  args: {
    domain: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, api.vercel.refreshDomainStatusFromVercel, {
      domain: args.domain,
      organizationId: args.organizationId,
    });
  },
});

/**
 * Remove a domain from Vercel and organization
 */
export const removeDomain = action({
  args: {
    organizationId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    await ctx.runQuery(api.permissions.requirePermission, {
      organizationId: args.organizationId,
      permission: "custom-domain",
    });

    // Check user is admin/owner
    const memberRecord = await ctx.runQuery(
      components.betterAuth.functions.getMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      },
    );

    if (
      !memberRecord ||
      (memberRecord.role !== "admin" && memberRecord.role !== "owner")
    ) {
      throw new Error("Insufficient permissions");
    }

    // Get organization
    const org = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationById,
      {
        id: args.organizationId,
      },
    );

    if (!org) {
      throw new Error("Organization not found");
    }

    if (!org.customDomain) {
      throw new Error("No domain to remove");
    }

    // Remove from Vercel
    try {
      await ctx.runAction(api.vercel.removeDomainFromVercel, {
        domain: org.customDomain,
      });
    } catch (error) {
      // Log but don't fail - domain might not exist in Vercel
      console.error("Failed to remove domain from Vercel:", error);
    }

    // Update organization to remove domain
    await ctx.runMutation(
      components.betterAuth.functions.updateOrganizationCustomDomain,
      {
        id: org._id,
        customDomain: null,
        domainVerificationStatus: null,
      },
    );

    return { success: true };
  },
});
