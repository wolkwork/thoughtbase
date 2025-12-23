import { idea } from "~/lib/db/schema";
import { db } from "./db";

/**
 * Helper utilities for idea-related tests
 */

/**
 * Create an idea programmatically using the API
 * @param options Idea details and authentication
 * @returns The created idea
 */
export async function createTestIdea(options: {
  organizationSlug: string;
  title: string;
  description?: string;
  cookies?: string;
}): Promise<{ id: string; title: string; description?: string }> {
  const response = await fetch(`http://localhost:3000/api/widget/ideas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.cookies ? { Cookie: options.cookies } : {}),
    },
    body: JSON.stringify({
      title: options.title,
      description: options.description || "",
      organizationSlug: options.organizationSlug,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to create test idea: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Create an idea directly in the database for test setup
 * @param options Idea details
 * @returns The created idea
 */
export async function createTestIdeaInDb(options: {
  organizationId: string;
  title: string;
  description?: string;
  status?: "open" | "in_progress" | "completed" | "closed" | "pending" | "planned";
}): Promise<{ id: string; title: string; description?: string; status: string }> {
  const ideaId = crypto.randomUUID();
  const [newIdea] = await db
    .insert(idea)
    .values({
      id: ideaId,
      organizationId: options.organizationId,
      title: options.title,
      description: options.description || null,
      status: options.status || "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    id: newIdea.id,
    title: newIdea.title,
    description: newIdea.description || undefined,
    status: newIdea.status,
  };
}
