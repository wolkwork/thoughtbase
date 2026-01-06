# Webhook Implementation Guide

This document explains how to implement the webhook endpoint in your app to support the Zapier REST Hook trigger for "New Idea".

## Overview

The Zapier integration uses REST Hooks, which means:
1. When a user sets up the trigger in Zapier, Zapier calls your subscribe endpoint with a webhook URL
2. Your app stores this webhook URL
3. When a new idea is created, your app POSTs the idea data to the webhook URL
4. Zapier receives the data and triggers the Zap

## Required Endpoint

### POST /api/zapier/webhooks/subscribe

Subscribe to webhooks for new ideas.

**Headers:**
- `x-api-key`: API key for authentication

**Request Body:**
```json
{
  "organizationId": "org-123",
  "event": "idea.created",
  "webhookUrl": "https://hooks.zapier.com/hooks/catch/123456/abcdef"
}
```

**Response:**
```json
{
  "id": "subscription-123",
  "organizationId": "org-123",
  "event": "idea.created",
  "webhookUrl": "https://hooks.zapier.com/hooks/catch/123456/abcdef",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### DELETE /api/zapier/webhooks/subscribe/:id

Unsubscribe from webhooks.

**Headers:**
- `x-api-key`: API key for authentication

**Response:**
```json
{
  "success": true
}
```

## Implementation Steps

### 1. Create Database Schema

You'll need to store webhook subscriptions. Add a table to track subscriptions:

```sql
CREATE TABLE webhook_subscription (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  api_key_id TEXT REFERENCES apikey(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX webhook_subscription_org_event_idx ON webhook_subscription(organization_id, event);
```

### 2. Create the Subscribe Endpoint

Create a route file: `apps/app/src/routes/api/zapier/webhooks/subscribe.ts`

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { webhookSubscription } from "~/lib/db/schema";
import { z } from "zod";

const subscribeSchema = z.object({
  organizationId: z.string(),
  event: z.string(),
  webhookUrl: z.string().url(),
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
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        const body = await request.json();
        const data = subscribeSchema.parse(body);

        // Verify user has access to the organization
        // Add your organization access check here

        // Create subscription
        const subscriptionId = crypto.randomUUID();
        await db.insert(webhookSubscription).values({
          id: subscriptionId,
          organizationId: data.organizationId,
          event: data.event,
          webhookUrl: data.webhookUrl,
          apiKeyId: session.session.userId, // Adjust based on your API key structure
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return new Response(
          JSON.stringify({
            id: subscriptionId,
            organizationId: data.organizationId,
            event: data.event,
            webhookUrl: data.webhookUrl,
            createdAt: new Date().toISOString(),
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
```

### 3. Create the Unsubscribe Endpoint

Create a route file: `apps/app/src/routes/api/zapier/webhooks/subscribe/$id.ts`

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { webhookSubscription } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

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
```

### 4. Trigger Webhooks When Ideas Are Created

In your idea creation function (e.g., `$createIdea` in `apps/app/src/lib/api/ideas.ts`), add webhook triggering:

```typescript
import { db } from "~/lib/db";
import { webhookSubscription } from "~/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function triggerWebhooks(organizationId: string, event: string, data: any) {
  // Find all subscriptions for this organization and event
  const subscriptions = await db.query.webhookSubscription.findMany({
    where: and(
      eq(webhookSubscription.organizationId, organizationId),
      eq(webhookSubscription.event, event)
    ),
  });

  // Send webhook to each subscription
  for (const subscription of subscriptions) {
    try {
      await fetch(subscription.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`Failed to send webhook to ${subscription.webhookUrl}:`, error);
      // Optionally: mark subscription as failed, retry later, etc.
    }
  }
}

// In your $createIdea function, after creating the idea:
export const $createIdea = createServerFn({ method: "POST" })
  .inputValidator(/* ... */)
  .handler(async ({ data }) => {
    // ... create idea logic ...
    
    const newIdea = await db.insert(idea).values(/* ... */).returning();

    // Trigger webhook
    await triggerWebhooks(
      data.organizationId,
      "idea.created",
      {
        id: newIdea[0].id,
        title: newIdea[0].title,
        description: newIdea[0].description,
        status: newIdea[0].status,
        organizationId: newIdea[0].organizationId,
        createdAt: newIdea[0].createdAt.toISOString(),
        updatedAt: newIdea[0].updatedAt.toISOString(),
        author: {
          // Include author data
        },
      }
    );

    return newIdea[0];
  });
```

## Webhook Payload Format

When sending webhooks, the payload should match the sample data structure in the trigger:

```json
{
  "id": "idea-123",
  "title": "Idea Title",
  "description": "Idea description",
  "status": "open",
  "organizationId": "org-123",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "author": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Security Considerations

1. **Validate API Keys**: Ensure the subscribe/unsubscribe endpoints validate API keys properly
2. **Organization Access**: Verify the user has access to the organization they're subscribing to
3. **Webhook URL Validation**: Validate that webhook URLs are from trusted domains (Zapier uses `hooks.zapier.com`)
4. **Rate Limiting**: Consider rate limiting webhook deliveries
5. **Error Handling**: Handle webhook delivery failures gracefully (retry logic, dead letter queue, etc.)

## Testing

1. Test the subscribe endpoint with a valid API key
2. Create a test idea and verify the webhook is sent
3. Test unsubscribe to ensure subscriptions are removed
4. Test with invalid API keys to ensure proper error handling

