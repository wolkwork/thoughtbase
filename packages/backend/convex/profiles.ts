import { ConvexError, v } from "convex/values";
import { api, components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { Doc } from "./_generated/dataModel";

/**
 * Get a profile for a user in an organization
 */
export const getProfile = query({
  args: {
    userId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .first();

    return profile || null;
  },
});

/**
 * Upsert a profile for a user in an organization
 */
export const upsertProfile = mutation({
  args: {
    organizationId: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    sessionId: v.union(
      v.literal("no-external-session"),
      v.id("externalSession"),
    ),
  },
  handler: async (ctx, args): Promise<Doc<"profile">> => {
    // Get current authenticated user
    const user = await ctx.runQuery(api.auth.getUnifiedUser, {
      sessionId: args.sessionId,
    });

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profile")
      .withIndex("by_userId_and_organizationId", (q) =>
        q.eq("userId", user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        name: args.name,
        image: args.image,
      });

      const updated = await ctx.db.get(existingProfile._id);

      if (!updated) {
        throw new ConvexError("Failed to update profile");
      }

      return updated;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("profile", {
        userId: user._id,
        organizationId: args.organizationId,
        name: args.name,
        image: args.image,
      });

      const profile = await ctx.db.get(profileId);

      if (!profile) {
        throw new ConvexError("Failed to create profile");
      }

      return profile;
    }
  },
});
