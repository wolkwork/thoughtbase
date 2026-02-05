import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Legacy table - can be removed if not needed
  numbers: defineTable({
    value: v.number(),
  }),

  // External users for widget/external auth
  externalUser: defineTable({
    organizationId: v.string(), // References betterAuth organization._id
    externalId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    revenue: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_externalId", ["organizationId", "externalId"]),

  // Boards
  board: defineTable({
    organizationId: v.string(), // References betterAuth organization._id
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_slug", ["slug"]),

  // Ideas
  idea: defineTable({
    organizationId: v.string(), // References betterAuth organization._id
    boardId: v.optional(v.id("board")),
    authorId: v.optional(v.string()), // References betterAuth user._id or externalUser._id
    authorType: v.optional(
      v.union(v.literal("internal"), v.literal("external")),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("reviewing"),
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("closed"),
      v.literal("pending"),
    ),
    eta: v.optional(v.number()), // timestamp in milliseconds
  })
    .index("by_organization", ["organizationId"])
    .index("by_board", ["boardId"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_organization_status", ["organizationId", "status"]),

  // Comments
  comment: defineTable({
    ideaId: v.id("idea"),
    authorId: v.string(), // References betterAuth user._id or "external"
    authorType: v.optional(
      v.union(v.literal("internal"), v.literal("external")),
    ),
    content: v.string(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_author", ["authorId"]),

  // Reactions
  reaction: defineTable({
    userId: v.string(), // References betterAuth user._id or "external"
    authorType: v.optional(
      v.union(v.literal("internal"), v.literal("external")),
    ),
    ideaId: v.optional(v.id("idea")),
    commentId: v.optional(v.id("comment")),
    type: v.string(), // e.g., "upvote", "like", etc.
  })
    .index("by_user", ["userId"])
    .index("by_idea", ["ideaId"])
    .index("by_comment", ["commentId"])
    .index("by_idea_type", ["ideaId", "type"])
    .index("by_comment_type", ["commentId", "type"]),

  // Tags
  tag: defineTable({
    organizationId: v.string(), // References betterAuth organization._id
    name: v.string(),
    color: v.optional(v.string()),
  }).index("by_organization", ["organizationId"]),

  // Idea-Tag junction table
  ideaTag: defineTable({
    ideaId: v.id("idea"),
    tagId: v.id("tag"),
  })
    .index("by_idea", ["ideaId"])
    .index("by_tag", ["tagId"])
    .index("by_idea_tag", ["ideaId", "tagId"]),

  // Changelogs
  changelog: defineTable({
    organizationId: v.string(), // References betterAuth organization._id
    title: v.string(),
    content: v.optional(v.string()), // Tiptap JSON stored as string
    featuredImage: v.optional(v.string()), // URL to featured image
    publishedAt: v.optional(v.number()), // timestamp in milliseconds
    status: v.union(v.literal("draft"), v.literal("published")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_publishedAt", ["publishedAt"]),

  // Changelog-Idea junction table
  changelogIdea: defineTable({
    changelogId: v.id("changelog"),
    ideaId: v.id("idea"),
  })
    .index("by_changelog", ["changelogId"])
    .index("by_idea", ["ideaId"])
    .index("by_changelog_idea", ["changelogId", "ideaId"]),

  // Profile - per-organization user profiles
  profile: defineTable({
    userId: v.string(), // References betterAuth user._id or externalUser._id
    authorType: v.optional(
      v.union(v.literal("internal"), v.literal("external")),
    ),
    organizationId: v.string(), // References betterAuth organization._id
    name: v.string(),
    image: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_organizationId", ["organizationId"])
    .index("by_userId_and_organizationId", ["userId", "organizationId"]),

  // External sessions for automatic login
  externalSession: defineTable({
    externalUserId: v.id("externalUser"),
    expiresAt: v.number(), // timestamp in milliseconds
  }).index("by_externalUserId", ["externalUserId"]),
});
