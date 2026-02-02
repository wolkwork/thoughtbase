import { doc } from "convex-helpers/validators";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

export const getOrganizationByCustomDomain = query({
  args: { customDomain: v.string() },
  returns: v.union(doc(schema, "organization"), v.null()),
  handler: async (ctx, { customDomain }) => {
    const organization = await ctx.db
      .query("organization")
      .withIndex("customDomain", (q) => q.eq("customDomain", customDomain))
      .first();

    return organization;
  },
});

export const checkMembership = query({
  args: { organizationId: v.string(), userId: v.string() },
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

export const getUserById = query({
  args: { id: v.id("user") },
  returns: v.union(doc(schema, "user"), v.null()),
  handler: (ctx, { id }) => {
    return ctx.db.get("user", id);
  },
});

export const getOrganizationById = query({
  args: { id: v.id("organization") },
  returns: v.union(doc(schema, "organization"), v.null()),
  handler: (ctx, { id }) => {
    return ctx.db.get("organization", id);
  },
});

export const updateOrganizationSecret = mutation({
  args: { id: v.id("organization"), secret: v.string() },
  returns: doc(schema, "organization"),
  handler: async (ctx, { id, secret }) => {
    await ctx.db.patch(id, { secret });
    const org = await ctx.db.get(id);
    if (!org) {
      throw new Error("Organization not found");
    }
    return org;
  },
});

export const updateOrganizationDomainStatus = mutation({
  args: {
    id: v.id("organization"),
    domainVerificationStatus: v.union(
      v.literal("invalid"),
      v.literal("pending"),
      v.literal("verified"),
    ),
    domainVerifiedAt: v.optional(v.number()),
    dnsRecordsToSet: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.union(v.literal("CNAME"), v.literal("A"), v.literal("TXT")),
          value: v.string(),
        }),
      ),
    ),
  },
  returns: doc(schema, "organization"),
  handler: async (
    ctx,
    { id, domainVerificationStatus, domainVerifiedAt, dnsRecordsToSet },
  ) => {
    await ctx.db.patch(id, {
      domainVerificationStatus,
      domainVerifiedAt,
      dnsRecordsToSet,
    });

    const org = await ctx.db.get(id);

    if (!org) {
      throw new Error("Organization not found");
    }

    return org;
  },
});

export const updateOrganizationCustomDomain = mutation({
  args: {
    id: v.id("organization"),
    customDomain: v.union(v.string(), v.null()),
    domainVerificationStatus: v.optional(
      v.union(
        v.literal("invalid"),
        v.literal("pending"),
        v.literal("verified"),
        v.null(),
      ),
    ),
    dnsRecordsToSet: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("CNAME"), v.literal("A"), v.literal("TXT")),
          name: v.string(),
          value: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, update) => {
    await ctx.db.patch(update.id, update);
  },
});

export const getMembership = query({
  args: { organizationId: v.id("organization"), userId: v.id("user") },
  returns: v.union(doc(schema, "member"), v.null()),
  handler: (ctx, { organizationId, userId }) => {
    return ctx.db
      .query("member")
      .withIndex("by_organizationId_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId),
      )
      .first();
  },
});

/**
 * Get count of admin/owner members for an organization
 */
export const getAdminCount = query({
  args: { organizationId: v.string() },
  returns: v.number(),
  handler: async (ctx, { organizationId }) => {
    const members = await ctx.db
      .query("member")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", organizationId),
      )
      .collect();

    const adminCount = members.filter(
      (m) => m.role === "admin" || m.role === "owner",
    ).length;

    return adminCount;
  },
});
