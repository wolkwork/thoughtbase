import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { externalUser } from "./external-auth-schema";

export const board = pgTable(
  "board",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("board_organizationId_idx").on(table.organizationId),
    index("board_slug_idx").on(table.slug),
  ],
);

export const idea = pgTable(
  "idea",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    boardId: text("board_id").references(() => board.id, { onDelete: "set null" }),
    // Polymorphic author: either standard user or external user
    authorId: text("author_id").notNull(),
    externalAuthorId: text("external_author_id").references(() => externalUser.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("open").notNull(), // open, in_progress, completed, closed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idea_organizationId_idx").on(table.organizationId),
    index("idea_boardId_idx").on(table.boardId),
    index("idea_authorId_idx").on(table.authorId),
    index("idea_status_idx").on(table.status),
  ],
);

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    ideaId: text("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    externalAuthorId: text("external_author_id").references(() => externalUser.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comment_ideaId_idx").on(table.ideaId),
    index("comment_authorId_idx").on(table.authorId),
  ],
);

export const reaction = pgTable(
  "reaction",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    externalUserId: text("external_user_id").references(() => externalUser.id, {
      onDelete: "cascade",
    }),
    ideaId: text("idea_id").references(() => idea.id, { onDelete: "cascade" }),
    commentId: text("comment_id").references(() => comment.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // e.g., "upvote", "like", etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reaction_userId_idx").on(table.userId),
    index("reaction_ideaId_idx").on(table.ideaId),
    index("reaction_commentId_idx").on(table.commentId),
  ],
);

export const tag = pgTable(
  "tag",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("tag_organizationId_idx").on(table.organizationId)],
);

export const ideaTag = pgTable(
  "idea_tag",
  {
    ideaId: text("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ideaId, table.tagId] }),
    index("ideaTag_ideaId_idx").on(table.ideaId),
    index("ideaTag_tagId_idx").on(table.tagId),
  ],
);

// Relations

export const boardRelations = relations(board, ({ one, many }) => ({
  organization: one(organization, {
    fields: [board.organizationId],
    references: [organization.id],
  }),
  ideas: many(idea),
}));

export const ideaRelations = relations(idea, ({ one, many }) => ({
  organization: one(organization, {
    fields: [idea.organizationId],
    references: [organization.id],
  }),
  board: one(board, {
    fields: [idea.boardId],
    references: [board.id],
  }),
  author: one(user, {
    fields: [idea.authorId],
    references: [user.id],
  }),
  externalAuthor: one(externalUser, {
    fields: [idea.externalAuthorId],
    references: [externalUser.id],
  }),
  comments: many(comment),
  reactions: many(reaction),
  tags: many(ideaTag),
}));

export const commentRelations = relations(comment, ({ one, many }) => ({
  idea: one(idea, {
    fields: [comment.ideaId],
    references: [idea.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  externalAuthor: one(externalUser, {
    fields: [comment.externalAuthorId],
    references: [externalUser.id],
  }),
  reactions: many(reaction),
}));

export const reactionRelations = relations(reaction, ({ one }) => ({
  user: one(user, {
    fields: [reaction.userId],
    references: [user.id],
  }),
  externalUser: one(externalUser, {
    fields: [reaction.externalUserId],
    references: [externalUser.id],
  }),
  idea: one(idea, {
    fields: [reaction.ideaId],
    references: [idea.id],
  }),
  comment: one(comment, {
    fields: [reaction.commentId],
    references: [comment.id],
  }),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  organization: one(organization, {
    fields: [tag.organizationId],
    references: [organization.id],
  }),
  ideas: many(ideaTag),
}));

export const ideaTagRelations = relations(ideaTag, ({ one }) => ({
  idea: one(idea, {
    fields: [ideaTag.ideaId],
    references: [idea.id],
  }),
  tag: one(tag, {
    fields: [ideaTag.tagId],
    references: [tag.id],
  }),
}));
