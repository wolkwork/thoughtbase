import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";
import { QueryCtx } from "./_generated/server";

const isCloud = process.env.THOUGHTBASE_CLOUD === "1";
const secretKey = process.env.AUTUMN_SECRET_KEY;

// Only require AUTUMN_SECRET_KEY in cloud mode
if (isCloud && !secretKey) {
  throw new Error("AUTUMN_SECRET_KEY is not set");
}

export const autumn = new Autumn(components.autumn, {
  secretKey: secretKey ?? "",
  identify: async (ctx: QueryCtx & { organizationId: string }) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) return null;
    if (!ctx.organizationId) return null;

    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationById,
      {
        id: ctx.organizationId,
      },
    );

    if (!organization) return null;

    return {
      customerId: organization._id,
      customerData: {
        name: organization.name,
        email: user.email,
      },
    };
  },
});

/**
 * These exports are required for our react hooks and components
 */

export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api();
