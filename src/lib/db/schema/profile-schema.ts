import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";

export const profile = pgTable(
  "profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("profile_userId_idx").on(table.userId),
    index("profile_organizationId_idx").on(table.organizationId),
    unique("profile_user_org_unique").on(table.userId, table.organizationId),
  ],
);

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [profile.organizationId],
    references: [organization.id],
  }),
}));

