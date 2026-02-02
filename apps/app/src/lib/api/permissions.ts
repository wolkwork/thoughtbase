import { api, getConvexClient } from "~/lib/convex/client";
import { Permission, plans } from "~/plans";

/**
 * Subscription tier types - matches plans.ts structure
 */
export type SubscriptionTier = (typeof plans)[keyof typeof plans]["slug"];

/**
 * Count the number of admin/owner members in an organization
 * Both "admin" and "owner" roles count toward the admin limit
 */
export async function getAdminCount(organizationId: string): Promise<number> {
  const convexClient = getConvexClient();
  const result = await convexClient.query(api.permissions.getAdminCount, {
    organizationId,
  });
  return result;
}

/**
 * Check if an organization can add another admin
 * Returns true if the organization hasn't reached its admin limit
 */
export async function canAddAdmin(organizationId: string): Promise<boolean> {
  const convexClient = getConvexClient();
  const result = await convexClient.query(api.permissions.canAddAdmin, {
    organizationId,
  });
  return result;
}

/**
 * Get full permissions object for an organization
 * Includes subscription tier, admin limits, and current counts
 */
export async function getPermissions(organizationId: string): Promise<{
  tier: SubscriptionTier;
  maxAdmins: number | null;
  currentAdminCount: number;
  canAddAdmin: boolean;
}> {
  const convexClient = getConvexClient();
  const result = await convexClient.query(api.permissions.getPermissions, {
    organizationId,
  });
  return result;
}

/**
 * Get the plan object for an organization based on subscription tier
 * Returns the plan from plans.ts with its permissions array
 */
export async function getPlanPermissions(
  organizationId: string,
): Promise<(typeof plans)[SubscriptionTier]> {
  const convexClient = getConvexClient();
  const result = await convexClient.query(api.permissions.getPlanPermissions, {
    organizationId,
  });
  // Map the Convex result to the plan structure
  const tier = result.slug as SubscriptionTier;
  return plans[tier];
}

/**
 * Check if an organization has a specific permission
 * @param organizationId The organization ID
 * @param permission The permission to check
 * @returns true if the organization has the permission, false otherwise
 */
export async function hasPermission(
  organizationId: string,
  permission: Permission,
): Promise<boolean> {
  const convexClient = getConvexClient();
  const result = await convexClient.query(api.permissions.hasPermission, {
    organizationId,
    permission,
  });
  return result;
}

/**
 * Require a specific permission for an organization
 * Throws an error if the organization doesn't have the permission
 * @param organizationId The organization ID
 * @param permission The permission to require
 * @throws Error if permission is missing
 */
export async function requirePermission(
  organizationId: string,
  permission: Permission,
): Promise<void> {
  const convexClient = getConvexClient();
  await convexClient.query(api.permissions.requirePermission, {
    organizationId,
    permission,
  });
}
