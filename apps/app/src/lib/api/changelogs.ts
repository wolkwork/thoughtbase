import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getUnifiedAuthContext } from "~/lib/auth/external-auth";
import { db } from "~/lib/db";
import { changelog, changelogIdea, idea } from "~/lib/db/schema";

// Context helper for auth
async function getAuthContext() {
  const unifiedCtx = await getUnifiedAuthContext();
  return {
    user: unifiedCtx?.user || null,
    session: unifiedCtx?.session || null,
    organizationId: unifiedCtx?.organizationId || null,
    type: unifiedCtx?.type || null,
  };
}

export const $getChangelogs = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      status: z.enum(["draft", "published"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }),
  )
  .handler(async ({ data }) => {
    const offset = (data.page - 1) * data.limit;

    const whereConditions = [eq(changelog.organizationId, data.organizationId)];

    if (data.status) {
      whereConditions.push(eq(changelog.status, data.status));
    }

    const changelogs = await db.query.changelog.findMany({
      where: and(...whereConditions),
      orderBy: desc(changelog.createdAt),
      limit: data.limit,
      offset,
      with: {
        ideas: {
          with: {
            idea: true,
          },
        },
      },
    });

    return changelogs.map((cl) => ({
      ...cl,
      ideas: cl.ideas.map((ci) => ci.idea),
    }));
  });

export const $getPublishedChangelogs = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }),
  )
  .handler(async ({ data }) => {
    const offset = (data.page - 1) * data.limit;

    const changelogs = await db.query.changelog.findMany({
      where: and(
        eq(changelog.organizationId, data.organizationId),
        eq(changelog.status, "published"),
      ),
      orderBy: desc(changelog.publishedAt),
      limit: data.limit,
      offset,
      with: {
        ideas: {
          with: {
            idea: true,
          },
        },
      },
    });

    return {
      items: changelogs.map((cl) => ({
        ...cl,
        ideas: cl.ideas.map((ci) => ci.idea),
      })),
      nextCursor: changelogs.length === data.limit ? data.page + 1 : null,
    };
  });

export const $getChangelog = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: changelogId }) => {
    const item = await db.query.changelog.findFirst({
      where: eq(changelog.id, changelogId),
      with: {
        ideas: {
          with: {
            idea: true,
          },
        },
      },
    });

    if (!item) return null;

    return {
      ...item,
      ideas: item.ideas.map((ci) => ci.idea),
    };
  });

export const $createChangelog = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      title: z.string().min(1),
      content: z.string().optional(),
      featuredImage: z.string().nullable().optional(),
      publishedAt: z.string().nullable().optional(),
      status: z.enum(["draft", "published"]).default("draft"),
      ideaIds: z.array(z.string()).default([]),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) throw new Error("Unauthorized");

    const changelogId = crypto.randomUUID();

    const [newChangelog] = await db
      .insert(changelog)
      .values({
        id: changelogId,
        organizationId: data.organizationId,
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        status: data.status,
      })
      .returning();

    // Insert linked ideas
    if (data.ideaIds.length > 0) {
      await db.insert(changelogIdea).values(
        data.ideaIds.map((ideaId) => ({
          changelogId,
          ideaId,
        })),
      );
    }

    return newChangelog;
  });

export const $updateChangelog = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      organizationId: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      featuredImage: z.string().nullable().optional(),
      publishedAt: z.string().nullable().optional(),
      status: z.enum(["draft", "published"]).optional(),
      ideaIds: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) throw new Error("Unauthorized");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedChangelog] = await db
      .update(changelog)
      .set(updateData)
      .where(
        and(eq(changelog.id, data.id), eq(changelog.organizationId, data.organizationId)),
      )
      .returning();

    // Update linked ideas if provided
    if (data.ideaIds !== undefined) {
      // Delete existing links
      await db.delete(changelogIdea).where(eq(changelogIdea.changelogId, data.id));

      // Insert new links
      if (data.ideaIds.length > 0) {
        await db.insert(changelogIdea).values(
          data.ideaIds.map((ideaId) => ({
            changelogId: data.id,
            ideaId,
          })),
        );
      }
    }

    return updatedChangelog;
  });

export const $deleteChangelog = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      organizationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getAuthContext();
    if (!ctx.user) throw new Error("Unauthorized");

    await db
      .delete(changelog)
      .where(
        and(eq(changelog.id, data.id), eq(changelog.organizationId, data.organizationId)),
      );

    return { success: true };
  });

export const $getCompletedIdeasSinceLastChangelog = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    // Find the most recent published changelog
    const lastChangelog = await db.query.changelog.findFirst({
      where: and(
        eq(changelog.organizationId, data.organizationId),
        eq(changelog.status, "published"),
      ),
      orderBy: desc(changelog.publishedAt),
    });

    // Get ideas that were completed (status = "completed") after the last changelog
    // If no changelog exists, get all completed ideas
    const whereConditions = [
      eq(idea.organizationId, data.organizationId),
      eq(idea.status, "completed"),
    ];

    if (lastChangelog?.publishedAt) {
      whereConditions.push(gt(idea.updatedAt, lastChangelog.publishedAt));
    }

    const completedIdeas = await db.query.idea.findMany({
      where: and(...whereConditions),
      orderBy: desc(idea.updatedAt),
    });

    return completedIdeas;
  });

export const $getIdeasForChangelogSelection = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    // Get all completed ideas that could be added to a changelog
    const completedIdeas = await db.query.idea.findMany({
      where: and(
        eq(idea.organizationId, data.organizationId),
        eq(idea.status, "completed"),
      ),
      orderBy: desc(idea.updatedAt),
    });

    return completedIdeas;
  });
