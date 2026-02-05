import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Update an external user's name
 */
export const updateExternalUserName = mutation({
  args: {
    externalUserId: v.id("externalUser"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const externalUser = await ctx.db.get(args.externalUserId);
    if (!externalUser) {
      throw new Error("External user not found");
    }

    await ctx.db.patch(args.externalUserId, {
      name: args.name,
    });

    const updated = await ctx.db.get(args.externalUserId);
    return updated;
  },
});

/**
 * Upsert an external user (create or update)
 */
export const upsertExternalUser = mutation({
  args: {
    organizationId: v.string(),
    externalId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    revenue: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if external user already exists
    const existing = await ctx.db
      .query("externalUser")
      .withIndex("by_organization_externalId", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("externalId", args.externalId)
      )
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        revenue: args.revenue,
        metadata: args.metadata,
      });

      const updated = await ctx.db.get(existing._id);
      return updated;
    } else {
      // Create new user
      const userId = await ctx.db.insert("externalUser", {
        organizationId: args.organizationId,
        externalId: args.externalId,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        revenue: args.revenue,
        metadata: args.metadata,
      });

      const user = await ctx.db.get(userId);
      return user;
    }
  },
});
