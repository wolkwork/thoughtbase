import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { autumn } from "./autumn";
import { components } from "./_generated/api";

const isCloud = process.env.THOUGHTBASE_CLOUD === "1";

export const checkAllowed = action({
  args: { organizationId: v.string() },
  handler: async (ctx, { organizationId }) => {
    // Always allow in self-hosted mode
    if (!isCloud) {
      return true;
    }

    const { data, error } = await autumn.check(
      { ...ctx, organizationId },
      {
        featureId: "cloud",
      },
    );

    if (error) {
      console.error(error);
      return false;
    }

    return data?.allowed ?? false;
  },
});

export const refreshCustomer = action({
  args: { organizationId: v.string() },
  handler: async (ctx, { organizationId }) => {
    if (!isCloud) {
      await ctx.scheduler.runAfter(
        0,
        components.betterAuth.functions.setOrganizationSubscription,
        {
          organizationId,
          subscriptionStatus: "active",
          subscriptionPeriodStart: undefined,
          subscriptionPeriodEnd: undefined,
        },
      );
      return undefined;
    }

    const { data, error } = await autumn.customers.get({
      ...ctx,
      organizationId,
    });

    if (error || !data) {
      console.error(error);
      return undefined;
    }

    const [product] = data.products;

    if (!product) {
      await ctx.scheduler.runAfter(
        0,
        components.betterAuth.functions.setOrganizationSubscription,
        {
          organizationId,
          subscriptionStatus: "expired",
          subscriptionPeriodStart: undefined,
          subscriptionPeriodEnd: undefined,
        },
      );

      return undefined;
    }

    await ctx.scheduler.runAfter(
      0,
      components.betterAuth.functions.setOrganizationSubscription,
      {
        organizationId,
        subscriptionStatus: product.status,
        subscriptionPeriodStart: product.current_period_start ?? undefined,
        subscriptionPeriodEnd: product.current_period_end ?? undefined,
      },
    );

    return data;
  },
});

export const getBillingPortalUrl = action({
  args: {
    organizationId: v.string(),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, { organizationId, returnUrl }) => {
    if (!isCloud) {
      return null;
    }

    const { data, error } = await autumn.customers.billingPortal(
      {
        ...ctx,
        organizationId,
      },
      {
        returnUrl,
      },
    );

    if (error || !data) {
      console.error("Failed to get billing portal URL:", error);
      return null;
    }

    return data;
  },
});
