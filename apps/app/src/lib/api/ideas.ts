import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getUnifiedAuthContext, getUserFromToken } from "~/lib/auth/external-auth";
import { db } from "~/lib/db";
import { board, comment, idea, reaction } from "~/lib/db/schema";

// Updated context helper to support unified auth
async function getAuthContext() {
  const unifiedCtx = await getUnifiedAuthContext();
  return {
    user: unifiedCtx?.user || null,
    session: unifiedCtx?.session || null,
    organizationId: unifiedCtx?.organizationId || null,
    type: unifiedCtx?.type || null,
  };
}

export const $getIdeas = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        status: z.string().optional(),
        boardId: z.string().optional(),
        organizationId: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();

    let organizationId = data?.organizationId;

    if (ctx.type === "external") {
      if (organizationId && organizationId !== ctx.organizationId) {
        throw new Error("Unauthorized access to organization data");
      }
      organizationId = ctx.organizationId!;
    } else if (!organizationId) {
      organizationId = ctx.organizationId || undefined;
    }

    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    const whereConditions = [eq(idea.organizationId, organizationId)];

    if (data?.status) {
      whereConditions.push(eq(idea.status, data.status));
    }

    if (data?.boardId) {
      whereConditions.push(eq(idea.boardId, data.boardId));
    }

    const ideas = await db.query.idea.findMany({
      where: and(...whereConditions),
      orderBy: desc(idea.createdAt),
      with: {
        author: true,
        externalAuthor: true,
        organization: true,
        board: true,
        tags: {
          with: {
            tag: true,
          },
        },
        comments: {
          columns: { id: true },
        },
        reactions: {
          with: {
            externalUser: true,
            user: true,
          },
        },
      },
    });

    return ideas.map((item) => {
      const author = item.externalAuthor || item.author;
      const image =
        author && "image" in author ? author.image : (author as any)?.avatarUrl;

      // Calculate total revenue from users who reacted
      const revenue = item.reactions.reduce((acc, reaction) => {
        // Prefer external user revenue, fallback to 0 (internal users don't have revenue tracked here usually)
        const userRevenue = reaction.externalUser?.revenue || 0;
        return acc + userRevenue;
      }, 0);

      return {
        ...item,
        author: {
          ...author,
          image, // Normalize image field
        },
        commentCount: item.comments.length,
        reactionCount: item.reactions.length,
        revenue,
      };
    });
  });

export const $getIdeasFeed = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      status: z.string().optional(),
      boardId: z.string().optional(),
      sort: z.enum(["newest", "top", "trending"]).default("newest"),
      page: z.number().default(1),
      limit: z.number().default(20),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();

    let organizationId: string | undefined = data.organizationId;

    if (ctx.type === "external") {
      if (organizationId && organizationId !== ctx.organizationId) {
        throw new Error("Unauthorized access to organization data");
      }
      organizationId = ctx.organizationId!;
    } else if (!organizationId) {
      organizationId = ctx.organizationId || undefined;
    }

    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    const offset = (data.page - 1) * data.limit;
    const whereConditions = [eq(idea.organizationId, organizationId)];

    if (data.status) {
      whereConditions.push(eq(idea.status, data.status));
    }
    if (data.boardId) {
      whereConditions.push(eq(idea.boardId, data.boardId));
    }

    let pagedIds: { id: string }[] = [];

    if (data.sort === "top") {
      pagedIds = await db
        .select({ id: idea.id })
        .from(idea)
        .leftJoin(reaction, eq(reaction.ideaId, idea.id))
        .where(and(...whereConditions))
        .groupBy(idea.id)
        .orderBy(desc(count(reaction.id)), desc(idea.createdAt))
        .limit(data.limit)
        .offset(offset);
    } else if (data.sort === "trending") {
      // Trending: Most reactions in last 7 days
      pagedIds = await db
        .select({ id: idea.id })
        .from(idea)
        .leftJoin(
          reaction,
          and(
            eq(reaction.ideaId, idea.id),
            sql`${reaction.createdAt} > now() - interval '7 day'`,
          ),
        )
        .where(and(...whereConditions))
        .groupBy(idea.id)
        .orderBy(desc(count(reaction.id)), desc(idea.createdAt))
        .limit(data.limit)
        .offset(offset);
    } else {
      // Newest
      pagedIds = await db
        .select({ id: idea.id })
        .from(idea)
        .where(and(...whereConditions))
        .orderBy(desc(idea.createdAt))
        .limit(data.limit)
        .offset(offset);
    }

    const ideaIds = pagedIds.map((p) => p.id);

    if (ideaIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const ideas = await db.query.idea.findMany({
      where: inArray(idea.id, ideaIds),
      with: {
        author: true,
        externalAuthor: true,
        organization: true,
        board: true,
        tags: {
          with: {
            tag: true,
          },
        },
        comments: {
          columns: { id: true },
        },
        reactions: true,
      },
    });

    // Re-sort in memory to match the ID order
    const ideasMap = new Map(ideas.map((i) => [i.id, i]));
    const sortedIdeas = ideaIds
      .map((id) => ideasMap.get(id))
      .filter((item): item is (typeof ideas)[number] => !!item);

    const mapped = sortedIdeas.map((item) => {
      const author = item.externalAuthor || item.author;
      const image =
        author && "image" in author ? author.image : (author as any)?.avatarUrl;
      return {
        ...item,
        author: {
          ...author,
          image,
        },
        commentCount: item.comments.length,
        reactionCount: item.reactions.length,
      };
    });

    return {
      items: mapped,
      nextCursor: mapped.length === data.limit ? data.page + 1 : null,
    };
  });

export const $getIdea = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: ideaId }) => {
    const item = await db.query.idea.findFirst({
      where: eq(idea.id, ideaId),
      with: {
        author: true,
        externalAuthor: true,
        board: true,
        tags: {
          with: {
            tag: true,
          },
        },
        comments: {
          with: {
            author: true,
            externalAuthor: true,
            reactions: true,
          },
          orderBy: desc(comment.createdAt),
        },
        reactions: {
          with: {
            user: true, // Fetch internal user
            externalUser: true, // Fetch external user
          },
        },
      },
    });

    if (!item) return null;

    const author = item.externalAuthor || item.author;
    const image = author && "image" in author ? author.image : (author as any)?.avatarUrl;

    return {
      ...item,
      author: {
        ...author,
        image,
      },
      comments: item.comments.map((c) => {
        const cAuthor = c.externalAuthor || c.author;
        const cImage =
          cAuthor && "image" in cAuthor ? cAuthor.image : (cAuthor as any)?.avatarUrl;
        return {
          ...c,
          author: {
            ...cAuthor,
            image: cImage,
          },
        };
      }),
      reactions: item.reactions.map((r) => ({
        ...r,
        user: r.user ? { ...r.user, image: r.user.image } : undefined,
        externalUser: r.externalUser
          ? { ...r.externalUser, image: r.externalUser?.avatarUrl }
          : undefined,
      })),
    };
  });

export const $createIdea = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      boardId: z.string().optional(),
      status: z.string().default("pending"),
      organizationId: z.string().optional(),
      token: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // If token is provided, validate it and use it to identify the user
    let user = null;
    let type: "internal" | "external" | null = null;

    if (data.token) {
      if (data.organizationId) {
        try {
          const externalUser = await getUserFromToken(data.token, data.organizationId);
          if (externalUser) {
            user = externalUser;
            type = "external";
          }
        } catch (e) {
          console.warn("Invalid SSO token provided for idea creation", e);
        }
      }
    }

    // Fallback to session context if no valid token provided or verification failed
    if (!user) {
      const ctx = await getAuthContext();
      user = ctx.user;
      type = ctx.type;
    }

    let organizationId = data.organizationId;

    if (type === "external") {
      if (organizationId && user && organizationId !== (user as any).organizationId) {
        // This check depends on externalUser having organizationId, which it does
        throw new Error("Unauthorized organization scope");
      }
      organizationId = (user as any)?.organizationId || organizationId; // Prefer user's org
    } else if (!organizationId) {
      // Try to infer from internal user session if available
      // But here we might just be guest
      organizationId = undefined;
    }

    if (!organizationId) throw new Error("No organization context");

    const [newIdea] = await db
      .insert(idea)
      .values({
        id: crypto.randomUUID(),
        organizationId: organizationId,
        authorId: type === "internal" && user ? user.id : null,
        externalAuthorId: type === "external" && user ? user.id : null,
        title: data.title,
        description: data.description,
        boardId: data.boardId,
        status: data.status,
      })
      .returning();

    return newIdea;
  });

export const $updateIdeaStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      status: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user || !ctx.organizationId)
      throw new Error("Unauthorized or no active organization");

    const [updatedIdea] = await db
      .update(idea)
      .set({ status: data.status, updatedAt: new Date() })
      .where(and(eq(idea.id, data.ideaId), eq(idea.organizationId, ctx.organizationId)))
      .returning();

    return updatedIdea;
  });

export const $updateIdeaEta = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      eta: z.string().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user || !ctx.organizationId)
      throw new Error("Unauthorized or no active organization");

    const [updatedIdea] = await db
      .update(idea)
      .set({
        eta: data.eta ? new Date(data.eta) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(idea.id, data.ideaId), eq(idea.organizationId, ctx.organizationId)))
      .returning();

    return updatedIdea;
  });

export const $createComment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      content: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) throw new Error("Unauthorized");

    const [newComment] = await db
      .insert(comment)
      .values({
        id: crypto.randomUUID(),
        ideaId: data.ideaId,
        authorId: ctx.type === "internal" ? ctx.user.id : "external",
        externalAuthorId: ctx.type === "external" ? ctx.user.id : null,
        content: data.content,
      })
      .returning();

    return newComment;
  });

export const $toggleReaction = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ideaId: z.string().optional(),
      commentId: z.string().optional(),
      type: z.string().default("upvote"),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) throw new Error("Unauthorized");

    let targetIdCondition;
    if (data.ideaId) {
      targetIdCondition = eq(reaction.ideaId, data.ideaId);
    } else {
      if (!data.commentId) throw new Error("Must provide either ideaId or commentId");
      targetIdCondition = eq(reaction.commentId, data.commentId!);
    }

    const userCondition =
      ctx.type === "internal"
        ? eq(reaction.userId, ctx.user.id)
        : eq(reaction.externalUserId, ctx.user.id);

    const existingReaction = await db.query.reaction.findFirst({
      where: and(userCondition, targetIdCondition, eq(reaction.type, data.type)),
    });

    if (existingReaction) {
      await db.delete(reaction).where(eq(reaction.id, existingReaction.id));
      return { action: "removed" };
    } else {
      await db.insert(reaction).values({
        id: crypto.randomUUID(),
        userId: ctx.type === "internal" ? ctx.user.id : "external",
        externalUserId: ctx.type === "external" ? ctx.user.id : null,
        ideaId: data.ideaId,
        commentId: data.commentId,
        type: data.type,
      });
      return { action: "added" };
    }
  });

export const $getSidebarCounts = createServerFn({ method: "GET" }).handler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.organizationId) throw new Error("No active organization");

  const statusCounts = await db
    .select({
      status: idea.status,
      count: count(),
    })
    .from(idea)
    .where(eq(idea.organizationId, ctx.organizationId))
    .groupBy(idea.status);

  return statusCounts.reduce(
    (acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    },
    {} as Record<string, number>,
  );
});

export const $getBoards = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        organizationId: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();

    let organizationId = data?.organizationId;
    if (ctx.type === "external") {
      if (organizationId && organizationId !== ctx.organizationId) {
        throw new Error("Unauthorized organization scope");
      }
      organizationId = ctx.organizationId!;
    } else if (!organizationId) {
      organizationId = ctx.organizationId || undefined;
    }

    if (!organizationId) throw new Error("No organization context");

    return db.query.board.findMany({
      where: eq(board.organizationId, organizationId),
      orderBy: desc(board.createdAt),
    });
  });

export const $getPublicCounts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const boardCounts = await db
      .select({
        id: board.id,
        name: board.name,
        count: count(),
      })
      .from(idea)
      .leftJoin(board, eq(idea.boardId, board.id))
      .where(eq(idea.organizationId, data.organizationId))
      .groupBy(board.id, board.name);

    return boardCounts;
  });
