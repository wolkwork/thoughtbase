import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { comment, externalUser, idea, reaction, user } from "~/lib/db/schema";

export type Member = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  type: "internal" | "external";
  revenue: number;
  commentCount: number;
  likeCount: number;
  lastActiveAt: Date | null;
  createdAt: Date;
};

export const $getMembers = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const organizationId = data.organizationId;

    // Get external users with their engagement stats
    const externalUsers = await db
      .select({
        id: externalUser.id,
        name: externalUser.name,
        email: externalUser.email,
        image: externalUser.avatarUrl,
        revenue: externalUser.revenue,
        createdAt: externalUser.createdAt,
      })
      .from(externalUser)
      .where(eq(externalUser.organizationId, organizationId));

    // Get comment counts for external users
    const externalCommentCounts = await db
      .select({
        externalAuthorId: comment.externalAuthorId,
        count: count(),
      })
      .from(comment)
      .innerJoin(idea, eq(comment.ideaId, idea.id))
      .where(
        and(
          eq(idea.organizationId, organizationId),
          sql`${comment.externalAuthorId} IS NOT NULL`,
        ),
      )
      .groupBy(comment.externalAuthorId);

    // Get reaction counts for external users
    const externalReactionCounts = await db
      .select({
        externalUserId: reaction.externalUserId,
        count: count(),
      })
      .from(reaction)
      .innerJoin(idea, eq(reaction.ideaId, idea.id))
      .where(
        and(
          eq(idea.organizationId, organizationId),
          sql`${reaction.externalUserId} IS NOT NULL`,
        ),
      )
      .groupBy(reaction.externalUserId);

    // Get last activity for external users (most recent comment or reaction)
    const externalLastComment = await db
      .select({
        externalAuthorId: comment.externalAuthorId,
        lastActivity: max(comment.createdAt),
      })
      .from(comment)
      .innerJoin(idea, eq(comment.ideaId, idea.id))
      .where(
        and(
          eq(idea.organizationId, organizationId),
          sql`${comment.externalAuthorId} IS NOT NULL`,
        ),
      )
      .groupBy(comment.externalAuthorId);

    const externalLastReaction = await db
      .select({
        externalUserId: reaction.externalUserId,
        lastActivity: max(reaction.createdAt),
      })
      .from(reaction)
      .innerJoin(idea, eq(reaction.ideaId, idea.id))
      .where(
        and(
          eq(idea.organizationId, organizationId),
          sql`${reaction.externalUserId} IS NOT NULL`,
        ),
      )
      .groupBy(reaction.externalUserId);

    // Build lookup maps for external users
    const extCommentMap = new Map(
      externalCommentCounts.map((c) => [c.externalAuthorId, c.count]),
    );
    const extReactionMap = new Map(
      externalReactionCounts.map((r) => [r.externalUserId, r.count]),
    );
    const extLastCommentMap = new Map(
      externalLastComment.map((c) => [c.externalAuthorId, c.lastActivity]),
    );
    const extLastReactionMap = new Map(
      externalLastReaction.map((r) => [r.externalUserId, r.lastActivity]),
    );

    // Map external users to Member type
    const externalMembers: Member[] = externalUsers.map((u) => {
      const lastComment = extLastCommentMap.get(u.id);
      const lastReaction = extLastReactionMap.get(u.id);
      const lastActiveAt =
        lastComment && lastReaction
          ? lastComment > lastReaction
            ? lastComment
            : lastReaction
          : lastComment || lastReaction || null;

      return {
        id: u.id,
        name: u.name || "Unknown",
        email: u.email,
        image: u.image,
        type: "external" as const,
        revenue: u.revenue || 0,
        commentCount: extCommentMap.get(u.id) || 0,
        likeCount: extReactionMap.get(u.id) || 0,
        lastActiveAt,
        createdAt: u.createdAt,
      };
    });

    // Get internal users who have interacted with this organization's ideas
    // (authored ideas, commented, or reacted)
    const internalUserIds = new Set<string>();

    // Users who authored ideas
    const ideaAuthors = await db
      .select({ authorId: idea.authorId })
      .from(idea)
      .where(
        and(eq(idea.organizationId, organizationId), sql`${idea.authorId} IS NOT NULL`),
      );
    ideaAuthors.forEach((i) => i.authorId && internalUserIds.add(i.authorId));

    // Users who commented (internal)
    const commentAuthors = await db
      .select({ authorId: comment.authorId })
      .from(comment)
      .innerJoin(idea, eq(comment.ideaId, idea.id))
      .where(
        and(
          eq(idea.organizationId, organizationId),
          sql`${comment.externalAuthorId} IS NULL`,
          sql`${comment.authorId} != 'external'`,
        ),
      );
    commentAuthors.forEach((c) => c.authorId && internalUserIds.add(c.authorId));

    // Users who reacted (internal)
    const reactionUsers = await db
      .select({ userId: reaction.userId })
      .from(reaction)
      .innerJoin(idea, eq(reaction.ideaId, idea.id))
      .where(
        and(
          eq(idea.organizationId, organizationId),
          sql`${reaction.externalUserId} IS NULL`,
          sql`${reaction.userId} != 'external'`,
        ),
      );
    reactionUsers.forEach((r) => r.userId && internalUserIds.add(r.userId));

    // Fetch internal user details
    const internalUserIdsArray = Array.from(internalUserIds);
    let internalMembers: Member[] = [];

    if (internalUserIdsArray.length > 0) {
      const internalUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(sql`${user.id} IN ${internalUserIdsArray}`);

      // Get comment counts for internal users
      const internalCommentCounts = await db
        .select({
          authorId: comment.authorId,
          count: count(),
        })
        .from(comment)
        .innerJoin(idea, eq(comment.ideaId, idea.id))
        .where(
          and(
            eq(idea.organizationId, organizationId),
            sql`${comment.externalAuthorId} IS NULL`,
            sql`${comment.authorId} IN ${internalUserIdsArray}`,
          ),
        )
        .groupBy(comment.authorId);

      // Get reaction counts for internal users
      const internalReactionCounts = await db
        .select({
          userId: reaction.userId,
          count: count(),
        })
        .from(reaction)
        .innerJoin(idea, eq(reaction.ideaId, idea.id))
        .where(
          and(
            eq(idea.organizationId, organizationId),
            sql`${reaction.externalUserId} IS NULL`,
            sql`${reaction.userId} IN ${internalUserIdsArray}`,
          ),
        )
        .groupBy(reaction.userId);

      // Get last activity for internal users
      const internalLastComment = await db
        .select({
          authorId: comment.authorId,
          lastActivity: max(comment.createdAt),
        })
        .from(comment)
        .innerJoin(idea, eq(comment.ideaId, idea.id))
        .where(
          and(
            eq(idea.organizationId, organizationId),
            sql`${comment.externalAuthorId} IS NULL`,
            sql`${comment.authorId} IN ${internalUserIdsArray}`,
          ),
        )
        .groupBy(comment.authorId);

      const internalLastReaction = await db
        .select({
          userId: reaction.userId,
          lastActivity: max(reaction.createdAt),
        })
        .from(reaction)
        .innerJoin(idea, eq(reaction.ideaId, idea.id))
        .where(
          and(
            eq(idea.organizationId, organizationId),
            sql`${reaction.externalUserId} IS NULL`,
            sql`${reaction.userId} IN ${internalUserIdsArray}`,
          ),
        )
        .groupBy(reaction.userId);

      // Build lookup maps for internal users
      const intCommentMap = new Map(
        internalCommentCounts.map((c) => [c.authorId, c.count]),
      );
      const intReactionMap = new Map(
        internalReactionCounts.map((r) => [r.userId, r.count]),
      );
      const intLastCommentMap = new Map(
        internalLastComment.map((c) => [c.authorId, c.lastActivity]),
      );
      const intLastReactionMap = new Map(
        internalLastReaction.map((r) => [r.userId, r.lastActivity]),
      );

      // Map internal users to Member type
      internalMembers = internalUsers.map((u) => {
        const lastComment = intLastCommentMap.get(u.id);
        const lastReaction = intLastReactionMap.get(u.id);
        const lastActiveAt =
          lastComment && lastReaction
            ? lastComment > lastReaction
              ? lastComment
              : lastReaction
            : lastComment || lastReaction || null;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          type: "internal" as const,
          revenue: 0, // Internal users don't have revenue tracked
          commentCount: intCommentMap.get(u.id) || 0,
          likeCount: intReactionMap.get(u.id) || 0,
          lastActiveAt,
          createdAt: u.createdAt,
        };
      });
    }

    // Combine and return all members
    return [...externalMembers, ...internalMembers];
  });
