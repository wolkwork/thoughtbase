import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";
import { idea } from "./idea-schema";

export const changelog = pgTable(
  "changelog",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"), // Tiptap JSON stored as string
    featuredImage: text("featured_image"), // URL to featured image
    publishedAt: timestamp("published_at"),
    status: text("status").default("draft").notNull(), // draft | published
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("changelog_organizationId_idx").on(table.organizationId),
    index("changelog_status_idx").on(table.status),
    index("changelog_publishedAt_idx").on(table.publishedAt),
  ],
);

export const changelogIdea = pgTable(
  "changelog_idea",
  {
    changelogId: text("changelog_id")
      .notNull()
      .references(() => changelog.id, { onDelete: "cascade" }),
    ideaId: text("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.changelogId, table.ideaId] }),
    index("changelogIdea_changelogId_idx").on(table.changelogId),
    index("changelogIdea_ideaId_idx").on(table.ideaId),
  ],
);

// Relations

export const changelogRelations = relations(changelog, ({ one, many }) => ({
  organization: one(organization, {
    fields: [changelog.organizationId],
    references: [organization.id],
  }),
  ideas: many(changelogIdea),
}));

export const changelogIdeaRelations = relations(changelogIdea, ({ one }) => ({
  changelog: one(changelog, {
    fields: [changelogIdea.changelogId],
    references: [changelog.id],
  }),
  idea: one(idea, {
    fields: [changelogIdea.ideaId],
    references: [idea.id],
  }),
}));
