import { and, count, eq, or } from "drizzle-orm";
import { polarClient } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member } from "~/lib/db/schema";
import { Permission, plans } from "~/plans";

/**
 * Subscription tier types - matches plans.ts structure
 */
export type SubscriptionTier = (typeof plans)[keyof typeof plans]["slug"];

// TODO: move to plans.ts
/**
 * Permissions matrix mapping subscription tiers to feature limits
 */
export const PERMISSIONS_MATRIX: Record<SubscriptionTier, { maxAdmins: number | null }> =
  {
    [plans.free.slug]: { maxAdmins: null },
    [plans.start.slug]: { maxAdmins: null },
    [plans.pro.slug]: { maxAdmins: null },
    [plans.business.slug]: { maxAdmins: null }, // null means unlimited
  };

/**
 * Get the active subscription tier for an organization
 * Fetches subscription data from Polar via betterAuth
 * betterAuth stores organization ID as customer.external_id in Polar
 */
export async function getSubscriptionTier(
  organizationId: string,
): Promise<SubscriptionTier> {
  try {
    const subscriptions = await polarClient.subscriptions.list({
      metadata: {
        referenceId: organizationId,
      },
    });

    if (!subscriptions.result?.items?.length) {
      return "free";
    }

    // Find the first active subscription
    const activeSubscription = subscriptions.result?.items?.find(
      (sub) => sub.status === "active" || sub.status === "trialing",
    );

    if (!activeSubscription) {
      return "free";
    }

    // Map Polar product slug to our tier system
    // The product slug comes from the checkout configuration in auth.ts
    const productSlug = activeSubscription.product.name.toLowerCase();

    if (productSlug === "start") {
      return "start";
    }

    if (productSlug === "pro") {
      return "pro";
    }

    if (productSlug === "business") {
      return "business";
    }

    // Default to free if product doesn't match known tiers
    return "free";
  } catch (error) {
    console.error("Error fetching subscription tier:", error);
    // On error, default to free tier
    return "free";
  }
}

/**
 * Count the number of admin/owner members in an organization
 * Both "admin" and "owner" roles count toward the admin limit
 */
export async function getAdminCount(organizationId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        or(eq(member.role, "admin"), eq(member.role, "owner")),
      ),
    );

  return result[0]?.count ?? 0;
}

/**
 * Check if an organization can add another admin
 * Returns true if the organization hasn't reached its admin limit
 */
export async function canAddAdmin(organizationId: string): Promise<boolean> {
  const tier = await getSubscriptionTier(organizationId);
  const currentCount = await getAdminCount(organizationId);
  const maxAdmins = PERMISSIONS_MATRIX[tier].maxAdmins;

  // null means unlimited
  if (maxAdmins === null) {
    return true;
  }

  return currentCount < maxAdmins;
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
  const tier = await getSubscriptionTier(organizationId);
  const currentAdminCount = await getAdminCount(organizationId);
  const maxAdmins = PERMISSIONS_MATRIX[tier].maxAdmins;
  const canAdd = maxAdmins === null || currentAdminCount < maxAdmins;

  return {
    tier,
    maxAdmins,
    currentAdminCount,
    canAddAdmin: canAdd,
  };
}

/**
 * Get the plan object for an organization based on subscription tier
 * Returns the plan from plans.ts with its permissions array
 */
export async function getPlanPermissions(
  organizationId: string,
): Promise<(typeof plans)[SubscriptionTier]> {
  const tier = await getSubscriptionTier(organizationId);
  const plan = plans[tier];
  return plan;
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
  const plan = await getPlanPermissions(organizationId);
  return (plan.permissions as readonly Permission[]).includes(permission);
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
  const hasAccess = await hasPermission(organizationId, permission);

  if (!hasAccess) {
    throw new Error(
      "Your trial has ended. Upgrade to continue creating and editing ideas.",
    );
  }
}
