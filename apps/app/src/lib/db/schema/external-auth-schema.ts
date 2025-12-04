import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";

export const externalUser = pgTable(
  "external_user",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("external_user_org_idx").on(table.organizationId),
    unique("external_user_org_external_id_unique").on(
      table.organizationId,
      table.externalId,
    ),
  ],
);

export const externalSession = pgTable(
  "external_session",
  {
    id: text("id").primaryKey(),
    externalUserId: text("external_user_id")
      .notNull()
      .references(() => externalUser.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("external_session_token_idx").on(table.token)],
);

export const externalUserRelations = relations(externalUser, ({ one }) => ({
  organization: one(organization, {
    fields: [externalUser.organizationId],
    references: [organization.id],
  }),
}));

export const externalSessionRelations = relations(externalSession, ({ one }) => ({
  externalUser: one(externalUser, {
    fields: [externalSession.externalUserId],
    references: [externalUser.id],
  }),
}));
