import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { query } from "./_generated/server";

/**
 * Subscription tier types
 */
export type SubscriptionTier = "free" | "start" | "pro" | "business";

/**
 * Permissions matrix mapping subscription tiers to feature limits
 * Mocked to assume business plan (unlimited admins)
 */
export const PERMISSIONS_MATRIX: Record<
  SubscriptionTier,
  { maxAdmins: number | null }
> = {
  free: { maxAdmins: null },
  start: { maxAdmins: null },
  pro: { maxAdmins: null },
  business: { maxAdmins: null }, // null means unlimited
};

/**
 * Get the active subscription tier for an organization
 * MOCKED: Always returns "business" as requested
 */
export const getSubscriptionTier = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Mock: Always return business plan
    return "business" as SubscriptionTier;
  },
});

/**
 * Count the number of admin/owner members in an organization
 * Both "admin" and "owner" roles count toward the admin limit
 */
export const getAdminCount = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Query admin count from betterAuth component
    const adminCount = await ctx.runQuery(
      components.betterAuth.functions.getAdminCount,
      {
        organizationId: args.organizationId,
      },
    );

    return adminCount;
  },
});

/**
 * Check if an organization can add another admin
 * Returns true if the organization hasn't reached its admin limit
 * MOCKED: Always returns true (business plan has unlimited admins)
 */
export const canAddAdmin = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Mock: Business plan has unlimited admins, so always return true
    return true;
  },
});

/**
 * Get full permissions object for an organization
 * Includes subscription tier, admin limits, and current counts
 * MOCKED: Returns business plan permissions
 */
export const getPermissions = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    tier: SubscriptionTier;
    maxAdmins: number | null;
    currentAdminCount: number;
    canAddAdmin: boolean;
  }> => {
    const tier = "business" as SubscriptionTier; // Mocked

    const currentAdminCount = await ctx.runQuery(
      api.permissions.getAdminCount,
      {
        organizationId: args.organizationId,
      },
    );

    const maxAdmins = PERMISSIONS_MATRIX[tier].maxAdmins;
    const canAdd = maxAdmins === null || currentAdminCount < maxAdmins;

    return {
      tier,
      maxAdmins,
      currentAdminCount,
      canAddAdmin: canAdd,
    };
  },
});

/**
 * Get the plan object for an organization based on subscription tier
 * Returns the plan with its permissions array
 * MOCKED: Returns business plan
 */
export const getPlanPermissions = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Mock: Return business plan permissions
    return {
      slug: "business",
      name: "Business",
      price: {
        month: 99,
        year: 990,
      },
      permissions: [
        "read",
        "write",
        "custom-domain",
        "white-label",
        "private-boards",
        "sso",
        "integrations",
      ],
    };
  },
});

/**
 * Check if an organization has a specific permission
 * @param organizationId The organization ID
 * @param permission The permission to check
 * @returns true if the organization has the permission, false otherwise
 */
export const hasPermission = query({
  args: {
    organizationId: v.string(),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    // Mock: Business plan has all permissions
    const businessPermissions = [
      "read",
      "write",
      "custom-domain",
      "white-label",
      "private-boards",
      "sso",
      "integrations",
    ];
    return businessPermissions.includes(args.permission);
  },
});

/**
 * Require a specific permission for an organization
 * Throws an error if the organization doesn't have the permission
 * MOCKED: Always succeeds (business plan has all permissions)
 */
export const requirePermission = query({
  args: {
    organizationId: v.string(),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    // Mock: Business plan has all permissions, so this always succeeds
    const hasAccess = await ctx.runQuery(api.permissions.hasPermission, {
      organizationId: args.organizationId,
      permission: args.permission,
    });

    if (!hasAccess) {
      throw new Error(
        "Your trial has ended. Upgrade to continue creating and editing ideas.",
      );
    }
  },
});
