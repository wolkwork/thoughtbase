import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { webhookSubscription } from "~/lib/db/schema";
import { getOrganizationFromApiKey } from "~/lib/api/webhooks";

export const Route = createFileRoute("/api/zapier/webhooks/subscribe/$id")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        // Authenticate using API key
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Get organization from API key session
        const orgContext = await getOrganizationFromApiKey();
        if (!orgContext) {
          return new Response(
            JSON.stringify({ error: "No organization found for API key" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verify the subscription belongs to this organization
        const subscription = await db.query.webhookSubscription.findFirst({
          where: eq(webhookSubscription.id, params.id),
        });

        if (!subscription) {
          return new Response(
            JSON.stringify({ error: "Subscription not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        if (subscription.organizationId !== orgContext.organizationId) {
          return new Response(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // Delete subscription
        await db
          .delete(webhookSubscription)
          .where(eq(webhookSubscription.id, params.id));

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});

