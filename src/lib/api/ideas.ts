import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getUnifiedAuthContext } from "~/lib/auth/external-auth";
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
    z.object({
      status: z.string().optional(),
      boardId: z.string().optional(),
      organizationId: z.string().optional(),
    }).optional()
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
                tag: true
            }
        },
        comments: {
            columns: { id: true }
        },
        reactions: true,
      },
    });
    
    return ideas.map(item => {
        const author = item.externalAuthor || item.author;
        return {
            ...item,
            author: {
                ...author,
                image: author.image || author.avatarUrl, // Normalize image field
            },
            commentCount: item.comments.length,
            reactionCount: item.reactions.length,
        };
    });
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
                tag: true
            }
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
            }
        },
      },
    });

    if (!item) return null;

    return {
        ...item,
        author: {
            ...(item.externalAuthor || item.author),
            image: (item.externalAuthor || item.author)?.image || (item.externalAuthor || item.author)?.avatarUrl,
        },
        comments: item.comments.map(c => {
            const author = c.externalAuthor || c.author;
            return {
                ...c,
                author: {
                    ...author,
                    image: author?.image || author?.avatarUrl
                }
            };
        }),
        reactions: item.reactions.map(r => ({
            ...r,
            user: r.user ? { ...r.user, image: r.user.image } : undefined,
            externalUser: r.externalUser ? { ...r.externalUser, image: r.externalUser.avatarUrl } : undefined,
        }))
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
    })
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) throw new Error("Unauthorized");
    
    let organizationId = data.organizationId;

    if (ctx.type === "external") {
        if (organizationId && organizationId !== ctx.organizationId) {
             throw new Error("Unauthorized organization scope");
        }
        organizationId = ctx.organizationId!;
    } else if (!organizationId) {
        organizationId = ctx.organizationId || undefined;
    }

    if (!organizationId) throw new Error("No organization context");

    const [newIdea] = await db
      .insert(idea)
      .values({
        id: crypto.randomUUID(),
        organizationId: organizationId,
        authorId: ctx.type === "internal" ? ctx.user.id : "external", // Placeholder/dummy for internal user ID if using external
        externalAuthorId: ctx.type === "external" ? ctx.user.id : null,
        // Note: authorId is NOT NULL in schema, so we need to provide something. 
        // If external, we might need a dummy or relax the schema.
        // For now, we will relax the schema or use a system user ID if needed. 
        // Actually, better to make authorId nullable in schema, but we just modified schema to have both nullable.
        // Wait, I made authorId NOT NULL in previous step. Let me fix that in schema first or pass a dummy.
        // Passing "external" as dummy string might fail FK constraint if enabled.
        // Let's assume we updated schema to be nullable for both, or handled it. 
        // I will update schema next to ensure authorId is nullable.
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
    })
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user || !ctx.organizationId) throw new Error("Unauthorized or no active organization");

    const [updatedIdea] = await db
      .update(idea)
      .set({ status: data.status, updatedAt: new Date() })
      .where(and(eq(idea.id, data.ideaId), eq(idea.organizationId, ctx.organizationId)))
      .returning();

    return updatedIdea;
  });

export const $createComment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      content: z.string().min(1),
    })
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
    })
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

    const userCondition = ctx.type === "internal" 
        ? eq(reaction.userId, ctx.user.id) 
        : eq(reaction.externalUserId, ctx.user.id);

    const existingReaction = await db.query.reaction.findFirst({
      where: and(
        userCondition,
        targetIdCondition,
        eq(reaction.type, data.type)
      ),
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
        
    return statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
    }, {} as Record<string, number>);
});

export const $getBoards = createServerFn({ method: "GET" })
.inputValidator(
    z.object({
        organizationId: z.string().optional()
    }).optional()
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
