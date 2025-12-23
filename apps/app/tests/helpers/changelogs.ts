import { randSentence, randWord } from "@ngneat/falso";
import { changelog } from "~/lib/db/schema";
import { db } from "./db";

/**
 * Helper utilities for changelog-related tests
 */

/**
 * Create a changelog entry directly in the database for test setup
 * @param options Changelog details
 * @returns The created changelog
 */
export async function createTestChangelog(options: {
  organizationId: string;
  title?: string;
  content?: string;
  status?: "draft" | "published";
  publishedAt?: Date;
}): Promise<{ id: string; title: string; content: string | null; status: string }> {
  const changelogId = crypto.randomUUID();
  const title = options.title || randSentence();
  const content = options.content || randSentence({ length: 3 }).join(" ");

  const [newChangelog] = await db
    .insert(changelog)
    .values({
      id: changelogId,
      organizationId: options.organizationId,
      title,
      content,
      status: options.status || "published",
      publishedAt: options.publishedAt || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    id: newChangelog.id,
    title: newChangelog.title,
    content: newChangelog.content,
    status: newChangelog.status,
  };
}
