import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

export type Member = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  type: "internal" | "external";
  revenue: number;
  commentCount: number;
  likeCount: number;
  lastActiveAt: number | null; // timestamp
  createdAt: number; // timestamp
};

/**
 * Get all members (contributors) for an organization
 * Includes both internal and external users who have interacted with ideas
 */
export const getMembers = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get external users with their engagement stats
    const externalUsers = await ctx.db
      .query("externalUser")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    // Get all ideas for this organization
    const ideas = await ctx.db
      .query("idea")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const ideaIds = ideas.map((i) => i._id);

    // Get all comments for these ideas
    const allComments = await Promise.all(
      ideaIds.map((ideaId) =>
        ctx.db
          .query("comment")
          .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
          .collect(),
      ),
    );
    const comments = allComments.flat();

    // Get all reactions for these ideas
    const allReactions = await Promise.all(
      ideaIds.map((ideaId) =>
        ctx.db
          .query("reaction")
          .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
          .collect(),
      ),
    );
    const reactions = allReactions.flat();

    // Build stats maps for external users
    const extCommentCounts = new Map<string, number>();
    const extReactionCounts = new Map<string, number>();
    const extLastComment = new Map<string, number>();
    const extLastReaction = new Map<string, number>();

    for (const comment of comments) {
      if (comment.authorType === "external") {
        const extId = comment.authorId;
        extCommentCounts.set(extId, (extCommentCounts.get(extId) || 0) + 1);
        const lastTime = extLastComment.get(extId);
        if (!lastTime || comment._creationTime > lastTime) {
          extLastComment.set(extId, comment._creationTime);
        }
      }
    }

    for (const reaction of reactions) {
      if (reaction.authorType === "external") {
        const extId = reaction.userId;
        extReactionCounts.set(extId, (extReactionCounts.get(extId) || 0) + 1);
        const lastTime = extLastReaction.get(extId);
        if (!lastTime || reaction._creationTime > lastTime) {
          extLastReaction.set(extId, reaction._creationTime);
        }
      }
    }

    // Map external users to Member type
    const externalMembers: Member[] = await Promise.all(
      externalUsers.map(async (u) => {
        const lastComment = extLastComment.get(u._id);
        const lastReaction = extLastReaction.get(u._id);
        const lastActiveAt =
          lastComment && lastReaction
            ? Math.max(lastComment, lastReaction)
            : lastComment || lastReaction || null;

        return {
          id: u._id,
          name: u.name || "Unknown",
          email: u.email || null,
          image: u.avatarUrl || null,
          type: "external" as const,
          revenue: u.revenue || 0,
          commentCount: extCommentCounts.get(u._id) || 0,
          likeCount: extReactionCounts.get(u._id) || 0,
          lastActiveAt,
          createdAt: u._creationTime,
        };
      }),
    );

    // Get internal users who have interacted with this organization's ideas
    const internalUserIds = new Set<string>();

    // Users who authored ideas
    for (const idea of ideas) {
      if (idea.authorId && idea.authorId !== "external") {
        internalUserIds.add(idea.authorId);
      }
    }

    // Users who commented (internal)
    for (const comment of comments) {
      if (comment.authorId && comment.authorId !== "external") {
        internalUserIds.add(comment.authorId);
      }
    }

    // Users who reacted (internal)
    for (const reaction of reactions) {
      if (reaction.userId && reaction.userId !== "external") {
        internalUserIds.add(reaction.userId);
      }
    }

    // Fetch internal user details
    const internalUserIdsArray = Array.from(internalUserIds);
    let internalMembers: Member[] = [];

    if (internalUserIdsArray.length > 0) {
      // Fetch users from betterAuth component
      // Note: userId strings need to be converted to Id<"user"> for getUserById
      // We'll query the user table directly using userId field if available, or try to convert
      const internalUsers = await Promise.all(
        internalUserIdsArray.map(async (userId) => {
          try {
            // Try to use getUserById with the string as an ID (Convex may handle conversion)
            return await ctx.runQuery(
              components.betterAuth.functions.getUserById,
              {
                id: userId as any, // Cast to Id<"user"> - the string should be a valid Convex ID
              },
            );
          } catch {
            return null;
          }
        }),
      );

      const validUsers = internalUsers.filter(
        (u): u is NonNullable<typeof u> => u !== null,
      );

      // Build stats maps for internal users
      const intCommentCounts = new Map<string, number>();
      const intReactionCounts = new Map<string, number>();
      const intLastComment = new Map<string, number>();
      const intLastReaction = new Map<string, number>();

      for (const comment of comments) {
        if (
          comment.authorId &&
          comment.authorId !== "external" &&
          internalUserIds.has(comment.authorId)
        ) {
          intCommentCounts.set(
            comment.authorId,
            (intCommentCounts.get(comment.authorId) || 0) + 1,
          );
          const lastTime = intLastComment.get(comment.authorId);
          if (!lastTime || comment._creationTime > lastTime) {
            intLastComment.set(comment.authorId, comment._creationTime);
          }
        }
      }

      for (const reaction of reactions) {
        if (
          reaction.userId &&
          reaction.userId === "internal" &&
          internalUserIds.has(reaction.userId)
        ) {
          intReactionCounts.set(
            reaction.userId,
            (intReactionCounts.get(reaction.userId) || 0) + 1,
          );
          const lastTime = intLastReaction.get(reaction.userId);
          if (!lastTime || reaction._creationTime > lastTime) {
            intLastReaction.set(reaction.userId, reaction._creationTime);
          }
        }
      }

      // Map internal users to Member type
      internalMembers = validUsers.map((u) => {
        const lastComment = intLastComment.get(u._id);
        const lastReaction = intLastReaction.get(u._id);
        const lastActiveAt =
          lastComment && lastReaction
            ? Math.max(lastComment, lastReaction)
            : lastComment || lastReaction || null;

        return {
          id: u._id,
          name: u.name || "Unknown",
          email: u.email || null,
          image: u.image || null,
          type: "internal" as const,
          revenue: 0, // Internal users don't have revenue tracked
          commentCount: intCommentCounts.get(u._id) || 0,
          likeCount: intReactionCounts.get(u._id) || 0,
          lastActiveAt,
          createdAt: u.createdAt,
        };
      });
    }

    // Combine and return all members
    return [...externalMembers, ...internalMembers];
  },
});
