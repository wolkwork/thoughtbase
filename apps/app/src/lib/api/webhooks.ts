import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { apikey, webhookSubscription } from "~/lib/db/schema";

/**
 * Get the organization ID from the API key session
 * API keys are tied to a user, and sessions have an activeOrganizationId
 */
export async function getOrganizationFromApiKey(): Promise<{
  organizationId: string;
  apiKeyId: string | null;
} | null> {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
  });

  if (!session?.session?.activeOrganizationId) {
    return null;
  }

  // Get the API key ID from the request headers
  const apiKeyHeader = getRequest().headers.get("x-api-key");
  let apiKeyId: string | null = null;

  if (apiKeyHeader) {
    const apiKeyRecord = await db.query.apikey.findFirst({
      where: eq(apikey.key, apiKeyHeader),
      columns: { id: true },
    });
    apiKeyId = apiKeyRecord?.id || null;
  }

  return {
    organizationId: session.session.activeOrganizationId,
    apiKeyId,
  };
}

/**
 * Trigger webhooks for a given organization and event
 */
export async function triggerWebhooks(
  organizationId: string,
  event: string,
  data: unknown,
): Promise<void> {
  // Find all subscriptions for this organization and event
  const subscriptions = await db.query.webhookSubscription.findMany({
    where: and(
      eq(webhookSubscription.organizationId, organizationId),
      eq(webhookSubscription.event, event),
    ),
  });

  // Send webhook to each subscription
  for (const subscription of subscriptions) {
    try {
      const response = await fetch(subscription.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error(
          `Failed to send webhook to ${subscription.webhookUrl}: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error(`Error sending webhook to ${subscription.webhookUrl}:`, error);
      // Optionally: mark subscription as failed, retry later, etc.
    }
  }
}
