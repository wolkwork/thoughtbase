import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getOrganizationFromApiKey } from "~/lib/api/webhooks";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { webhookSubscription } from "~/lib/db/schema";

const subscribeSchema = z.object({
  event: z.string(),
  webhookUrl: z.url(),
});

export const Route = createFileRoute("/api/zapier/webhooks/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate using API key
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Get organization from API key session
        const orgContext = await getOrganizationFromApiKey();
        if (!orgContext) {
          return new Response(
            JSON.stringify({ error: "No organization found for API key" }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }

        const body = await request.json();
        const data = subscribeSchema.parse(body);

        // Validate webhook URL is from Zapier
        if (!data.webhookUrl.startsWith("https://hooks.zapier.com/")) {
          return new Response(
            JSON.stringify({
              error: "Invalid webhook URL. Must be from hooks.zapier.com",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Create subscription
        const subscriptionId = crypto.randomUUID();
        await db.insert(webhookSubscription).values({
          id: subscriptionId,
          organizationId: orgContext.organizationId,
          event: data.event,
          webhookUrl: data.webhookUrl,
          apiKeyId: orgContext.apiKeyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return new Response(
          JSON.stringify({
            id: subscriptionId,
            organizationId: orgContext.organizationId,
            event: data.event,
            webhookUrl: data.webhookUrl,
            createdAt: new Date().toISOString(),
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
