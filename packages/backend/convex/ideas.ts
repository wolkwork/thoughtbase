import { paginationOptsValidator } from "convex/server";
import type { PaginationResult } from "convex/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { mutation, query, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { getUnifiedAuthor } from "./helpers";

/**
 * Get sidebar counts (idea counts by status) for an organization
 */
export const getSidebarCounts = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("idea")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const counts: Record<string, number> = {};
    for (const idea of ideas) {
      counts[idea.status] = (counts[idea.status] || 0) + 1;
    }

    return counts;
  },
});

/**
 * Get ideas for an organization with all related data
 */
export const getIdeas = query({
  args: {
    organizationId: v.string(),
    status: v.optional(v.string()),
    boardId: v.optional(v.id("board")),
  },
  handler: async (ctx, args) => {
    // Build query with filters
    const ideasQuery = ctx.db
      .query("idea")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      );

    const ideas = await ideasQuery.collect();

    // Filter by status and boardId if provided
    let filteredIdeas = ideas;
    if (args.status) {
      filteredIdeas = filteredIdeas.filter(
        (idea) => idea.status === args.status
      );
    }
    if (args.boardId) {
      filteredIdeas = filteredIdeas.filter(
        (idea) => idea.boardId === args.boardId
      );
    }

    // Sort by creation time (newest first)
    filteredIdeas.sort((a, b) => b._creationTime - a._creationTime);

    // Fetch related data for each idea
    const result = await Promise.all(
      filteredIdeas.map(async (idea) => {
        // Fetch author (internal user from betterAuth)
        // Note: betterAuth users are in a component, so we'll skip for now
        // and handle it on the client side or via a different approach
        const author = await getUnifiedAuthor(ctx, idea);

        // Fetch board
        let board = null;
        if (idea.boardId) {
          const boardDoc = await ctx.db.get(idea.boardId);
          if (boardDoc) {
            board = {
              id: boardDoc._id,
              name: boardDoc.name,
              description: boardDoc.description || null,
              slug: boardDoc.slug,
            };
          }
        }

        // Fetch tags
        const ideaTags = await ctx.db
          .query("ideaTag")
          .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
          .collect();

        const tags = await Promise.all(
          ideaTags.map(async (it) => {
            const tag = await ctx.db.get(it.tagId);
            return tag
              ? {
                  id: tag._id,
                  name: tag.name,
                  color: tag.color || null,
                }
              : null;
          })
        );

        // Fetch comments count
        const comments = await ctx.db
          .query("comment")
          .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
          .collect();

        // Fetch reactions with external users for revenue calculation
        const reactions = await ctx.db
          .query("reaction")
          .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
          .collect();

        // Calculate revenue from reactions
        let revenue = 0;
        for (const reaction of reactions) {
          if (reaction.authorType === "external") {
            const extUser = await ctx.db.get(
              reaction.userId as Id<"externalUser">
            );
            if (extUser?.revenue) {
              revenue += extUser.revenue;
            }
          }
        }

        return {
          ...idea,
          author,
          board,
          tags: tags.filter((t): t is NonNullable<typeof t> => t !== null),
          commentCount: comments.length,
          reactionCount: reactions.length,
          revenue,
        };
      })
    );

    return result;
  },
});

/**
 * Get public ideas feed with pagination and sorting
 * Filters out pending and closed ideas
 */
export const getIdeasPublic = query({
  args: {
    organizationId: v.string(),
    status: v.optional(v.string()),
    boardId: v.optional(v.id("board")),
    sort: v.optional(
      v.union(v.literal("newest"), v.literal("top"), v.literal("trending"))
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    args
  ): Promise<PaginationResult<Awaited<ReturnType<typeof enrichIdea>>>> => {
    const sort = args.sort || "newest";
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Build base query
    let ideasQuery = ctx.db
      .query("idea")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      );

    // For "newest" sort, we can use pagination directly
    if (sort === "newest") {
      let query = ideasQuery.order("desc");

      // Apply filters
      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      } else {
        // Filter out pending and closed by default
        query = query.filter(
          (q) =>
            q.neq(q.field("status"), "pending") &&
            q.neq(q.field("status"), "closed")
        );
      }

      if (args.boardId) {
        query = query.filter((q) => q.eq(q.field("boardId"), args.boardId));
      }

      const paginated = await query.paginate(args.paginationOpts);

      // Fetch related data for each idea
      const page = await Promise.all(
        paginated.page.map(async (idea) => {
          return await enrichIdea(ctx, idea);
        })
      );

      return {
        ...paginated,
        page,
      };
    }

    // For "top" and "trending", we need to fetch all ideas, calculate scores, and sort
    // Note: This is less efficient but necessary for sorting by reaction counts
    const allIdeas = await ideasQuery.collect();

    // Filter ideas
    let filteredIdeas = allIdeas.filter(
      (idea) => idea.status !== "pending" && idea.status !== "closed"
    );

    if (args.status) {
      filteredIdeas = filteredIdeas.filter(
        (idea) => idea.status === args.status
      );
    }

    if (args.boardId) {
      filteredIdeas = filteredIdeas.filter(
        (idea) => idea.boardId === args.boardId
      );
    }

    // Calculate scores for each idea
    const ideasWithScores = await Promise.all(
      filteredIdeas.map(async (idea) => {
        let score = 0;

        if (sort === "top") {
          // Count all reactions
          const reactions = await ctx.db
            .query("reaction")
            .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
            .collect();
          score = reactions.length;
        } else if (sort === "trending") {
          // Count reactions from last 7 days
          const reactions = await ctx.db
            .query("reaction")
            .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
            .collect();
          score = reactions.filter(
            (r) => r._creationTime >= sevenDaysAgo
          ).length;
        }

        return {
          idea,
          score,
          createdAt: idea._creationTime,
        };
      })
    );

    // Sort by score (descending), then by creation time (descending)
    ideasWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAt - a.createdAt;
    });

    // Manual pagination
    const cursor = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor, 10)
      : 0;
    const numItems = args.paginationOpts.numItems;
    const startIndex = cursor;
    const endIndex = cursor + numItems;
    const page = ideasWithScores.slice(startIndex, endIndex);
    const isDone = endIndex >= ideasWithScores.length;
    const continueCursor = isDone ? "done" : endIndex.toString();

    // Enrich ideas with related data
    const enrichedPage = await Promise.all(
      page.map(async ({ idea }) => {
        return await enrichIdea(ctx, idea);
      })
    );

    return {
      page: enrichedPage,
      isDone,
      continueCursor,
    };
  },
});

/**
 * Helper function to enrich an idea with related data
 */
async function enrichIdea(ctx: QueryCtx, idea: Doc<"idea">) {
  const author = await getUnifiedAuthor(ctx, idea);

  // Fetch board
  let board = null;
  if (idea.boardId) {
    const boardDoc = await ctx.db.get(idea.boardId);
    if (boardDoc) {
      board = {
        id: boardDoc._id,
        name: boardDoc.name,
        description: boardDoc.description || null,
        slug: boardDoc.slug,
      };
    }
  }

  // Fetch tags
  const ideaTags = await ctx.db
    .query("ideaTag")
    .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
    .collect();

  const tags = await Promise.all(
    ideaTags.map(async (it) => {
      return ctx.db.get(it.tagId);
    })
  );

  // Fetch comments count
  const comments = await ctx.db
    .query("comment")
    .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
    .collect();

  // Fetch reactions
  const reactions = await ctx.db
    .query("reaction")
    .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
    .collect();

  return {
    _id: idea._id,
    _creationTime: idea._creationTime,
    organizationId: idea.organizationId,
    boardId: idea.boardId,
    title: idea.title,
    description: idea.description || null,
    status: idea.status,
    createdAt: idea._creationTime,
    updatedAt: idea._creationTime,
    eta: idea.eta || null,
    author,
    board,
    tags: tags.filter((t): t is NonNullable<typeof t> => t !== null),
    commentCount: comments.length,
    reactionCount: reactions.length,
    reactions,
  };
}

// TODO: Split these up into idea, comment, and reaction queries
/**
 * Get a single idea by ID with all related data
 */
export const getIdea = query({
  args: {
    ideaId: v.id("idea"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return null;
    }

    const author = await getUnifiedAuthor(ctx, idea);

    // Fetch board
    const board = idea.boardId ? await ctx.db.get(idea.boardId) : null;

    // Fetch tags
    const ideaTags = await ctx.db
      .query("ideaTag")
      .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
      .collect();

    const tags = await Promise.all(
      ideaTags.map(async (it) => {
        const tag = await ctx.db.get(it.tagId);
        return tag
          ? {
              id: tag._id,
              name: tag.name,
              color: tag.color || null,
            }
          : null;
      })
    );

    // Fetch comments with their authors and reactions
    const comments = await ctx.db
      .query("comment")
      .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
      .collect();

    // Sort comments by creation time (newest first)
    comments.sort((a, b) => b._creationTime - a._creationTime);

    const commentsWithData = await Promise.all(
      comments.map(async (comment) => {
        // Fetch comment author (internal user)
        const cAuthor = await getUnifiedAuthor(ctx, comment);

        // Fetch comment reactions
        const commentReactions = await ctx.db
          .query("reaction")
          .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
          .collect();

        return {
          id: comment._id,
          ideaId: comment.ideaId,
          content: comment.content,
          createdAt: comment._creationTime,
          author: cAuthor,
          reactions: commentReactions.map((r) => ({
            id: r._id,
            type: r.type,
            createdAt: r._creationTime,
            userId: r.userId,
            authorType: r.authorType,
          })),
        };
      })
    );

    // Fetch reactions with user data
    const reactions = await ctx.db
      .query("reaction")
      .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
      .collect();

    const reactionsWithData = await Promise.all(
      reactions.map(async (reaction) => {
        const user = await getUnifiedAuthor(ctx, reaction);

        return {
          id: reaction._id,
          type: reaction.type,
          createdAt: reaction._creationTime,
          userId: reaction.userId,
          authorType: reaction.authorType,
          user,
        };
      })
    );

    return {
      id: idea._id,
      organizationId: idea.organizationId,
      boardId: idea.boardId,
      authorId: idea.authorId,
      title: idea.title,
      description: idea.description || null,
      status: idea.status,
      createdAt: idea._creationTime,
      updatedAt: idea._creationTime,
      eta: idea.eta || null,
      author,
      board,
      tags: tags
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .map((tag) => ({
          tag: {
            id: tag.id as string,
            name: tag.name,
            color: tag.color,
          },
        })),
      comments: commentsWithData,
      reactions: reactionsWithData,
    };
  },
});

// TODO: Split these up into idea, comment, and reaction queries
/**
 * Get a single idea by ID with all related data
 */
export const getPublicIdea = query({
  args: {
    ideaId: v.id("idea"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return null;
    }

    // Fetch author (internal user from betterAuth)
    const author = await getUnifiedAuthor(ctx, idea);

    // Fetch board
    const board = idea.boardId ? await ctx.db.get(idea.boardId) : null;

    // Fetch tags
    const ideaTags = await ctx.db
      .query("ideaTag")
      .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
      .collect();

    const tags = await Promise.all(
      ideaTags.map(async (it) => {
        const tag = await ctx.db.get(it.tagId);
        return tag
          ? {
              id: tag._id,
              name: tag.name,
              color: tag.color || null,
            }
          : null;
      })
    );

    // Fetch comments with their authors and reactions
    const comments = await ctx.db
      .query("comment")
      .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
      .collect();

    // Sort comments by creation time (newest first)
    comments.sort((a, b) => b._creationTime - a._creationTime);

    const commentsWithData = await Promise.all(
      comments.map(async (comment) => {
        // Fetch comment author (internal user)
        const cAuthor = await getUnifiedAuthor(ctx, comment);

        // Fetch comment reactions
        const commentReactions = await ctx.db
          .query("reaction")
          .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
          .collect();

        return {
          id: comment._id,
          ideaId: comment.ideaId,
          content: comment.content,
          createdAt: comment._creationTime,
          author: cAuthor,
          reactions: commentReactions.map((r) => ({
            id: r._id,
            type: r.type,
            createdAt: r._creationTime,
            userId: r.userId,
            authorType: r.authorType,
          })),
        };
      })
    );

    // Fetch reactions with user data
    const reactions = await ctx.db
      .query("reaction")
      .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
      .collect();

    const reactionsWithData = await Promise.all(
      reactions.map(async (reaction) => {
        const user = await getUnifiedAuthor(ctx, reaction);

        return {
          id: reaction._id,
          type: reaction.type,
          createdAt: reaction._creationTime,
          userId: reaction.userId,
          authorType: reaction.authorType,
          user,
        };
      })
    );

    return {
      id: idea._id,
      organizationId: idea.organizationId,
      boardId: idea.boardId,
      authorId: idea.authorId,
      title: idea.title,
      description: idea.description || null,
      status: idea.status,
      createdAt: idea._creationTime,
      updatedAt: idea._creationTime,
      eta: idea.eta || null,
      author,
      board,
      tags: tags
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .map((tag) => ({
          tag: {
            id: tag.id as string,
            name: tag.name,
            color: tag.color,
          },
        })),
      comments: commentsWithData,
      reactions: reactionsWithData,
    };
  },
});

/**
 * Create a new idea
 */
export const createIdea = mutation({
  args: {
    organizationId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    boardId: v.optional(v.id("board")),
    sessionId: v.optional(v.id("externalSession")),
  },
  handler: async (ctx, args): Promise<Doc<"idea">> => {
    // Get current authenticated user
    const user = await ctx.runQuery(api.auth.getUnifiedUser, {
      sessionId: args.sessionId ?? "no-external-session",
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of the organization
    const isMember = await ctx.runQuery(
      components.betterAuth.functions.checkMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      }
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Create the idea
    const ideaId = await ctx.db.insert("idea", {
      organizationId: args.organizationId,
      authorId: user._id,
      title: args.title,
      description: args.description,
      boardId: args.boardId,
      status: "pending",
    });

    // Return the created idea
    const idea = await ctx.db.get(ideaId);
    if (!idea) {
      throw new Error("Failed to create idea");
    }

    return idea;
  },
});

/**
 * Update an idea's status
 */
export const updateIdeaStatus = mutation({
  args: {
    ideaId: v.id("idea"),
    status: v.union(
      v.literal("reviewing"),
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("closed"),
      v.literal("pending")
    ),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of the organization
    const isMember = await ctx.runQuery(
      components.betterAuth.functions.checkMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      }
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Verify the idea exists and belongs to the organization
    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.organizationId !== args.organizationId) {
      throw new Error("Idea not found");
    }

    // Update the idea status
    await ctx.db.patch(args.ideaId, {
      status: args.status,
    });

    // Return the updated idea
    const updated = await ctx.db.get(args.ideaId);
    if (!updated) {
      throw new Error("Failed to update idea");
    }

    return {
      id: updated._id,
      organizationId: updated.organizationId,
      boardId: updated.boardId,
      authorId: updated.authorId,
      authorType: updated.authorType,
      title: updated.title,
      description: updated.description || null,
      status: updated.status,
      createdAt: updated._creationTime,
      updatedAt: updated._creationTime,
      eta: updated.eta || null,
    };
  },
});

/**
 * Create a comment on an idea
 * Supports both internal (betterAuth) and external users via unified user
 */
export const createComment = mutation({
  args: {
    ideaId: v.id("idea"),
    content: v.string(),
    sessionId: v.optional(
      v.union(v.literal("no-external-session"), v.id("externalSession"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.auth.getUnifiedUser, {
      sessionId: args.sessionId ?? "no-external-session",
    });
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify the idea exists and get its organization
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Create the comment (unified user covers both internal and external)
    await ctx.db.insert("comment", {
      ideaId: args.ideaId,
      authorId: user._id,
      authorType: user.type,
      content: args.content,
    });
  },
});

/**
 * Toggle a reaction on an idea or comment
 * Supports both internal (betterAuth) and external users
 */
export const toggleReaction = mutation({
  args: {
    ideaId: v.optional(v.id("idea")),
    commentId: v.optional(v.id("comment")),
    type: v.optional(v.string()),
    sessionId: v.optional(
      v.union(v.literal("no-external-session"), v.id("externalSession"))
    ),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user (internal)
    const user = await ctx.runQuery(api.auth.getUnifiedUser, {
      sessionId: args.sessionId ?? "no-external-session",
    });

    // For external users, we need the externalUserId from args

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Determine which target we're reacting to
    if (!args.ideaId && !args.commentId) {
      throw new Error("Must provide either ideaId or commentId");
    }

    const reactionType = args.type || "upvote";

    // Get the idea or comment to verify organization access
    let organizationId: string | null = null;

    if (args.ideaId) {
      const idea = await ctx.db.get(args.ideaId);
      if (!idea) {
        throw new Error("Idea not found");
      }
      organizationId = idea.organizationId;
    } else if (args.commentId) {
      const comment = await ctx.db.get(args.commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }
      const idea = await ctx.db.get(comment.ideaId);
      if (!idea) {
        throw new Error("Idea not found");
      }
      organizationId = idea.organizationId;
    }

    // Find existing reaction
    let existingReaction = null;

    if (args.ideaId) {
      const reactions = await ctx.db
        .query("reaction")
        .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
        .collect();

      existingReaction = reactions.find((r) => {
        return r.userId === user!._id && r.type === reactionType;
      });
    } else if (args.commentId) {
      const reactions = await ctx.db
        .query("reaction")
        .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
        .collect();

      existingReaction = reactions.find((r) => {
        return r.userId === user!._id && r.type === reactionType;
      });
    }

    if (existingReaction) {
      await ctx.db.delete(existingReaction._id);
    } else {
      await ctx.db.insert("reaction", {
        userId: user!._id,
        authorType: user.type,
        ideaId: args.ideaId || undefined,
        commentId: args.commentId || undefined,
        type: reactionType,
      });
    }
  },
});

/**
 * Update an idea's ETA
 */
export const updateIdeaEta = mutation({
  args: {
    ideaId: v.id("idea"),
    eta: v.optional(v.number()),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of the organization
    const isMember = await ctx.runQuery(
      components.betterAuth.functions.checkMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      }
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Verify the idea exists and belongs to the organization
    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.organizationId !== args.organizationId) {
      throw new Error("Idea not found");
    }

    // Update the idea ETA
    await ctx.db.patch(args.ideaId, {
      eta: args.eta,
    });

    // Return the updated idea
    const updated = await ctx.db.get(args.ideaId);
    if (!updated) {
      throw new Error("Failed to update idea");
    }

    return updated;
  },
});

/**
 * Update an idea's title and description
 * Supports both internal (betterAuth) and external users via unified user
 */
export const updateIdea = mutation({
  args: {
    ideaId: v.id("idea"),
    title: v.string(),
    description: v.optional(v.string()),
    sessionId: v.optional(
      v.union(v.literal("no-external-session"), v.id("externalSession"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.auth.getUnifiedUser, {
      sessionId: args.sessionId ?? "no-external-session",
    });
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get the idea to check ownership
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if user is the author (works for both internal and external)
    if (idea.authorId !== user._id) {
      throw new Error("Only the author can edit this idea");
    }

    // Update the idea
    await ctx.db.patch(args.ideaId, {
      title: args.title,
      description: args.description,
    });
  },
});

/**
 * Delete an idea
 */
export const deleteIdea = mutation({
  args: {
    ideaId: v.id("idea"),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of the organization
    const isMember = await ctx.runQuery(
      components.betterAuth.functions.checkMembership,
      {
        organizationId: args.organizationId,
        userId: user._id,
      }
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Verify the idea exists and belongs to the organization
    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.organizationId !== args.organizationId) {
      throw new Error("Idea not found");
    }

    // Delete related comments
    const comments = await ctx.db
      .query("comment")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete related reactions
    const reactions = await ctx.db
      .query("reaction")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    // Delete idea-tag relationships
    const ideaTags = await ctx.db
      .query("ideaTag")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    for (const ideaTag of ideaTags) {
      await ctx.db.delete(ideaTag._id);
    }

    // Delete the idea
    await ctx.db.delete(args.ideaId);

    return { success: true };
  },
});

/**
 * Get public roadmap ideas for an organization
 * Excludes pending ideas and sensitive data
 */
export const getPublicRoadmapIdeas = query({
  args: {
    organizationSlug: v.string(),
  },
  handler: async (ctx, args) => {
    // Get organization by slug
    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationBySlug,
      {
        slug: args.organizationSlug,
      }
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get all ideas for this organization, excluding pending
    const allIdeas = await ctx.db
      .query("idea")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organization._id)
      )
      .collect();

    // Filter out pending ideas
    const ideas = allIdeas.filter((idea) => idea.status !== "pending");

    // Sort by creation time (newest first)
    ideas.sort((a, b) => b._creationTime - a._creationTime);

    // Fetch related data for each idea
    const result = await Promise.all(
      ideas.map(async (idea) => {
        // Fetch author (internal user from betterAuth)
        const author = await getUnifiedAuthor(ctx, idea);

        // Fetch board
        const board = idea.boardId ? await ctx.db.get(idea.boardId) : null;

        // Fetch tags
        const ideaTags = await ctx.db
          .query("ideaTag")
          .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
          .collect();

        const tags = await Promise.all(
          ideaTags.map(async (it) => {
            const tag = await ctx.db.get(it.tagId);
            return tag;
          })
        );

        // Count comments
        const comments = await ctx.db
          .query("comment")
          .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
          .collect();

        // Count reactions
        const reactions = await ctx.db
          .query("reaction")
          .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
          .collect();

        return {
          id: idea._id,
          title: idea.title,
          description: idea.description || null,
          status: idea.status,
          eta: idea.eta || null,
          createdAt: idea._creationTime,
          updatedAt: idea._creationTime,
          board: board
            ? {
                id: board._id,
                name: board.name,
              }
            : null,
          tags: tags
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .map((t) => ({
              id: t._id,
              name: t.name,
              color: t.color || null,
            })),
          author,
          commentCount: comments.length,
          reactionCount: reactions.length,
        };
      })
    );

    return result;
  },
});
