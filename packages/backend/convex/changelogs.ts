import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Get published changelogs for an organization by slug (paginated)
 */
export const getPublishedChangelogs = query({
  args: {
    organizationSlug: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Get organization by slug
    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationBySlug,
      {
        slug: args.organizationSlug,
      },
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Query changelogs by organization
    const publishedChangelogs = await ctx.db
      .query("changelog")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .paginate(args.paginationOpts);

    // Fetch related ideas for each changelog
    const page = await Promise.all(
      publishedChangelogs.page.map(async (changelog) => {
        const changelogIdeas = await ctx.db
          .query("changelogIdea")
          .withIndex("by_changelog", (q) => q.eq("changelogId", changelog._id))
          .collect();

        const ideas = await Promise.all(
          changelogIdeas.map(async (ci) => {
            const idea = await ctx.db.get(ci.ideaId);
            if (!idea) return null;

            // Get reaction count for the idea
            const reactions = await ctx.db
              .query("reaction")
              .withIndex("by_idea_type", (q) =>
                q.eq("ideaId", idea._id).eq("type", "like"),
              )
              .collect();

            return {
              id: idea._id,
              title: idea.title,
              description: idea.description || null,
              reactionCount: reactions.length,
            };
          }),
        );

        return {
          id: changelog._id,
          organizationId: changelog.organizationId,
          title: changelog.title,
          content: changelog.content || null,
          featuredImage: changelog.featuredImage || null,
          publishedAt: changelog.publishedAt || null,
          status: changelog.status,
          createdAt: changelog._creationTime,
          updatedAt: changelog._creationTime,
          ideas: ideas.filter((i): i is NonNullable<typeof i> => i !== null),
        };
      }),
    );

    // Determine if there are more items

    return {
      ...publishedChangelogs,
      page,
    };
  },
});

/**
 * Get changelogs for an organization
 */
export const getChangelogs = query({
  args: {
    organizationId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("changelog")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      );

    const changelogs = await query.collect();

    // Filter by status if provided
    let filtered = changelogs;
    if (args.status) {
      filtered = filtered.filter((c) => c.status === args.status);
    }

    // Sort by creation time (newest first)
    filtered.sort((a, b) => b._creationTime - a._creationTime);

    // Fetch related ideas for each changelog
    const result = await Promise.all(
      filtered.map(async (changelog) => {
        const changelogIdeas = await ctx.db
          .query("changelogIdea")
          .withIndex("by_changelog", (q) => q.eq("changelogId", changelog._id))
          .collect();

        const ideas = await Promise.all(
          changelogIdeas.map(async (ci) => {
            const idea = await ctx.db.get(ci.ideaId);
            return idea;
          }),
        );

        return {
          ...changelog,
          ideas: ideas.filter((i): i is NonNullable<typeof i> => i !== null),
        };
      }),
    );

    return result;
  },
});

/**
 * Get a single changelog by ID
 */
export const getChangelog = query({
  args: {
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const changelog = await ctx.db.get(args.changelogId);
    if (!changelog) {
      return null;
    }

    // Fetch related ideas
    const changelogIdeas = await ctx.db
      .query("changelogIdea")
      .withIndex("by_changelog", (q) => q.eq("changelogId", changelog._id))
      .collect();

    const ideas = (
      await Promise.all(
        changelogIdeas.map(async (ci) => {
          const idea = await ctx.db.get(ci.ideaId);
          return idea;
        }),
      )
    ).filter((i): i is NonNullable<typeof i> => i !== null);

    return {
      changelog,
      ideas,
    };
  },
});

/**
 * Create a new changelog
 */
export const createChangelog = mutation({
  args: {
    organizationId: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    featuredImage: v.optional(v.union(v.string(), v.null())),
    publishedAt: v.optional(v.union(v.string(), v.null())),
    status: v.union(v.literal("draft"), v.literal("published")),
    ideaIds: v.optional(v.array(v.id("idea"))),
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
      },
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Status is now directly "draft" | "published" in schema
    const mappedStatus = args.status;

    // Convert publishedAt from string to timestamp if provided
    const publishedAtTimestamp = args.publishedAt
      ? new Date(args.publishedAt).getTime()
      : undefined;

    // Create the changelog
    const changelogId = await ctx.db.insert("changelog", {
      organizationId: args.organizationId,
      title: args.title,
      content: args.content,
      featuredImage: args.featuredImage || undefined,
      publishedAt: publishedAtTimestamp,
      status: mappedStatus,
    });

    // Insert linked ideas if provided
    if (args.ideaIds && args.ideaIds.length > 0) {
      await Promise.all(
        args.ideaIds.map((ideaId) =>
          ctx.db.insert("changelogIdea", {
            changelogId,
            ideaId,
          }),
        ),
      );
    }

    // Return the created changelog
    const changelog = await ctx.db.get(changelogId);
    if (!changelog) {
      throw new Error("Failed to create changelog");
    }

    return {
      id: changelog._id,
      organizationId: changelog.organizationId,
      title: changelog.title,
      content: changelog.content || null,
      featuredImage: changelog.featuredImage || null,
      publishedAt: changelog.publishedAt || null,
      status: changelog.status,
      createdAt: changelog._creationTime,
      updatedAt: changelog._creationTime,
    };
  },
});

/**
 * Update a changelog
 */
export const updateChangelog = mutation({
  args: {
    id: v.id("changelog"),
    organizationId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    featuredImage: v.optional(v.union(v.string())),
    publishedAt: v.optional(v.union(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    ideaIds: v.optional(v.array(v.id("idea"))),
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
      },
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Verify the changelog exists and belongs to the organization
    const changelog = await ctx.db.get(args.id);
    if (!changelog || changelog.organizationId !== args.organizationId) {
      throw new Error("Changelog not found");
    }

    // Update the changelog
    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      featuredImage: args.featuredImage,
      publishedAt: args.publishedAt
        ? new Date(args.publishedAt).getTime()
        : undefined,
      status: args.status,
    });

    // Update linked ideas if provided
    if (args.ideaIds !== undefined) {
      // Delete existing links
      const existingLinks = await ctx.db
        .query("changelogIdea")
        .withIndex("by_changelog", (q) => q.eq("changelogId", args.id))
        .collect();

      for (const link of existingLinks) {
        await ctx.db.delete(link._id);
      }

      // Insert new links
      if (args.ideaIds.length > 0) {
        await Promise.all(
          args.ideaIds.map((ideaId) =>
            ctx.db.insert("changelogIdea", {
              changelogId: args.id,
              ideaId,
            }),
          ),
        );
      }
    }

    // Return the updated changelog
    const updated = await ctx.db.get(args.id);
    if (!updated) {
      throw new Error("Failed to update changelog");
    }

    return {
      id: updated._id,
      organizationId: updated.organizationId,
      title: updated.title,
      content: updated.content || null,
      featuredImage: updated.featuredImage || null,
      publishedAt: updated.publishedAt || null,
      status: updated.status,
      createdAt: updated._creationTime,
      updatedAt: updated._creationTime,
    };
  },
});

/**
 * Delete a changelog
 */
export const deleteChangelog = mutation({
  args: {
    id: v.id("changelog"),
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
      },
    );

    if (!isMember) {
      throw new Error("You are not a member of this organization");
    }

    // Verify the changelog exists and belongs to the organization
    const changelog = await ctx.db.get(args.id);
    if (!changelog || changelog.organizationId !== args.organizationId) {
      throw new Error("Changelog not found");
    }

    // Delete linked ideas first
    const changelogIdeas = await ctx.db
      .query("changelogIdea")
      .withIndex("by_changelog", (q) => q.eq("changelogId", args.id))
      .collect();

    for (const link of changelogIdeas) {
      await ctx.db.delete(link._id);
    }

    // Delete the changelog
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Get all completed ideas for changelog selection
 */
export const getIdeasForChangelogSelection = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all completed ideas for the organization
    const ideas = await ctx.db
      .query("idea")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "completed"),
      )
      .collect();

    // Sort by creation time (newest first)
    ideas.sort((a, b) => b._creationTime - a._creationTime);

    return ideas.map((idea) => ({
      id: idea._id,
      title: idea.title,
      description: idea.description || null,
      status: idea.status,
      createdAt: idea._creationTime,
      updatedAt: idea._creationTime,
    }));
  },
});

/**
 * Get completed ideas since the last published changelog
 */
export const getCompletedIdeasSinceLastChangelog = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the most recent published changelog
    const changelogs = await ctx.db
      .query("changelog")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const publishedChangelogs = changelogs
      .filter((c) => c.status === "published" && c.publishedAt)
      .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

    const lastChangelog = publishedChangelogs[0];
    const lastPublishedAt = lastChangelog?.publishedAt;

    // Get all completed ideas for the organization
    const allCompletedIdeas = await ctx.db
      .query("idea")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "completed"),
      )
      .collect();

    // Filter ideas that were completed after the last changelog
    // If no changelog exists, return all completed ideas
    let filteredIdeas = allCompletedIdeas;
    if (lastPublishedAt) {
      filteredIdeas = allCompletedIdeas.filter(
        (idea) => idea._creationTime > lastPublishedAt,
      );
    }

    // Sort by creation time (newest first)
    filteredIdeas.sort((a, b) => b._creationTime - a._creationTime);

    return filteredIdeas.map((idea) => ({
      id: idea._id,
      title: idea.title,
      description: idea.description || null,
      status: idea.status,
      createdAt: idea._creationTime,
      updatedAt: idea._creationTime,
    }));
  },
});
