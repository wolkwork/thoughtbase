import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { apikey, organization } from "./auth-schema";

export const webhookSubscription = pgTable(
  "webhook_subscription",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    webhookUrl: text("webhook_url").notNull(),
    apiKeyId: text("api_key_id").references(() => apikey.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_subscription_org_event_idx").on(table.organizationId, table.event),
    index("webhook_subscription_api_key_idx").on(table.apiKeyId),
  ]
);

export const webhookSubscriptionRelations = relations(webhookSubscription, ({ one }) => ({
  organization: one(organization, {
    fields: [webhookSubscription.organizationId],
    references: [organization.id],
  }),
  apiKey: one(apikey, {
    fields: [webhookSubscription.apiKeyId],
    references: [apikey.id],
  }),
}));

