import { and, count, eq, or } from "drizzle-orm";
import { polarClient } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { member } from "~/lib/db/schema";

/**
 * Subscription tier types
 */
export type SubscriptionTier = "free" | "starter" | "business";

/**
 * Permissions matrix mapping subscription tiers to feature limits
 */
export const PERMISSIONS_MATRIX: Record<SubscriptionTier, { maxAdmins: number | null }> =
  {
    free: { maxAdmins: 1 },
    starter: { maxAdmins: 3 },
    business: { maxAdmins: null }, // null means unlimited
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
    // First, find the customer by external_id (which is the organization ID)
    const customers = await polarClient.customers.list({
      organizationId,
      limit: 1,
    });

    const customer = customers.result?.items?.[0];

    if (!customer) {
      return "free";
    }

    // Then, get subscriptions for this customer
    const subscriptions = await polarClient.subscriptions.list({
      customerId: customer.id,
    });

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

    if (productSlug === "starter") {
      return "starter";
    }

    if (productSlug === "business") {
      // Map "growth" to "business" per user preference
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
