import { doc } from "convex-helpers/validators";
import { v } from "convex/values";
import { query } from "./_generated/server";
import schema from "./schema";

export const getOrganizationBySlug = query({
  args: { slug: v.string() },
  returns: v.union(doc(schema, "organization"), v.null()),
  handler: async (ctx, { slug }) => {
    const organization = await ctx.db
      .query("organization")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .first();

    return organization;
  },
});

export const checkMembership = query({
  args: { organizationId: v.id("organization"), userId: v.id("user") },
  returns: v.boolean(),
  handler: async (ctx, { organizationId, userId }) => {
    const member = await ctx.db
      .query("member")
      .withIndex("by_organizationId_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId),
      )
      .first();

    return !!member;
  },
});
