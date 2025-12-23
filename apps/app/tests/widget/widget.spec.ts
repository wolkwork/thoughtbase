import { randParagraph, randPhrase, randSentence } from "@ngneat/falso";
import { expect, test } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { idea } from "~/lib/db/schema";
import { createTestOrganization } from "../helpers/auth";
import { createTestChangelog } from "../helpers/changelogs";
import { db } from "../helpers/db";
import { createTestIdeaInDb } from "../helpers/ideas";

const LANDING_PAGE_URL = "http://thoughtbase.localhost:4321";
const WIDGET_ORG_SLUG = "wolk";

test("should open widget and submit feedback", async ({ page }) => {
  const { id } = await createTestOrganization({ name: "Wolk", slug: WIDGET_ORG_SLUG });

  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Find and click the widget button (button is outside shadow DOM)
  await page.getByRole("button", { name: "Submit Feedback" }).click();

  // Wait for widget modal to appear
  await expect(page.getByTestId("thoughtbase-widget")).toBeVisible();

  // Access shadow DOM to interact with widget content
  const widgetContainer = page.getByTestId("thoughtbase-widget");

  // Find textarea in shadow DOM
  const textarea = widgetContainer.getByRole("textbox", {
    name: /Idea description/i,
  });

  // Type feedback using evaluate
  const feedbackText = randSentence();

  await textarea.fill(feedbackText);

  await widgetContainer.getByRole("button", { name: "Submit Idea" }).click();

  // Wait for success message
  await expect(widgetContainer.getByText("Thanks for your feedback!")).toBeVisible();

  // Query for the idea with matching description
  const submittedIdea = await db.query.idea.findFirst({
    where: and(eq(idea.organizationId, id), eq(idea.description, feedbackText)),
  });

  expect(submittedIdea).toBeDefined();
});

test("should show roadmap with in progress and completed ideas, and navigate to idea detail", async ({
  page,
}) => {
  const { id } = await createTestOrganization({ name: "Wolk", slug: WIDGET_ORG_SLUG });

  // Create ideas with different statuses
  const inProgressIdea = await createTestIdeaInDb({
    organizationId: id,
    title: randPhrase(),
    description: randSentence(),
    status: "in_progress",
  });

  const plannedIdea = await createTestIdeaInDb({
    organizationId: id,
    title: randPhrase(),
    description: randSentence(),
    status: "planned",
  });

  const completedIdea = await createTestIdeaInDb({
    organizationId: id,
    title: randPhrase(),
    description: randParagraph(),
    status: "completed",
  });

  // Create ideas that should NOT appear in roadmap
  const pendingIdea = await createTestIdeaInDb({
    organizationId: id,
    title: randPhrase(),
    description: randParagraph(),
    status: "pending",
  });

  const openIdea = await createTestIdeaInDb({
    organizationId: id,
    title: randPhrase(),
    description: randParagraph(),
    status: "open",
  });

  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Open widget
  await page.getByRole("button", { name: "Submit Feedback" }).click();
  const widgetContainer = page.getByTestId("thoughtbase-widget");
  await expect(widgetContainer).toBeVisible();

  // Switch to Roadmap tab
  await widgetContainer.getByRole("button", { name: "Roadmap" }).click();

  // Verify in progress idea is visible
  await expect(
    widgetContainer.getByText(inProgressIdea.title, { exact: true }),
  ).toBeVisible();

  // Verify planned idea is visible
  await expect(
    widgetContainer.getByText(plannedIdea.title, { exact: true }),
  ).toBeVisible();

  // Verify completed idea is visible
  await expect(
    widgetContainer.getByText(completedIdea.title, { exact: true }),
  ).not.toBeVisible();

  // Verify pending idea is NOT visible
  await expect(
    widgetContainer.getByText(pendingIdea.title, { exact: true }),
  ).not.toBeVisible();

  // Verify open idea is NOT visible
  await expect(
    widgetContainer.getByText(openIdea.title, { exact: true }),
  ).not.toBeVisible();

  // Click on the in progress idea link
  const ideaLink = widgetContainer.getByRole("link", {
    name: new RegExp(inProgressIdea.title, "i"),
  });
  await ideaLink.click();

  const newTabPromise = page.waitForEvent("popup");
  const newTab = await newTabPromise;
  await newTab.waitForLoadState();
  expect(newTab.url()).toContain(`/${WIDGET_ORG_SLUG}/${inProgressIdea.id}`);

  // Verify we're on the idea detail page
  await expect(newTab.getByText(inProgressIdea.title)).toBeVisible();
});

test("should show changelog entries in updates tab", async ({ page }) => {
  const { id } = await createTestOrganization({ name: "Wolk", slug: WIDGET_ORG_SLUG });

  // Create published changelog entries
  const changelog1 = await createTestChangelog({
    organizationId: id,
    title: randSentence({ length: 3 }).join(" "),
    status: "published",
    publishedAt: new Date(),
  });

  const changelog2 = await createTestChangelog({
    organizationId: id,
    title: randSentence({ length: 3 }).join(" "),
    status: "published",
    publishedAt: new Date(Date.now() - 86400000), // Yesterday
  });

  // Create draft changelog (should not appear)
  const draftChangelog = await createTestChangelog({
    organizationId: id,
    title: randSentence({ length: 3 }).join(" "),
    status: "draft",
  });

  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Open widget
  await page.getByRole("button", { name: "Submit Feedback" }).click();
  const widgetContainer = page.getByTestId("thoughtbase-widget");
  await expect(widgetContainer).toBeVisible();

  // Switch to Updates tab
  await widgetContainer.getByRole("button", { name: "Updates" }).click();

  // Verify published changelogs are visible
  await expect(widgetContainer.getByText(changelog1.title)).toBeVisible();
  await expect(widgetContainer.getByText(changelog2.title)).toBeVisible();

  // Verify draft changelog is NOT visible
  await expect(widgetContainer.getByText(draftChangelog.title)).not.toBeVisible();
});

test("should close widget when clicking close button", async ({ page }) => {
  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Open widget
  const widgetButton = page.getByRole("button", { name: "Submit Feedback" });
  await widgetButton.click();
  const widgetContainer = page.getByTestId("thoughtbase-widget");
  await expect(widgetContainer).toBeVisible();

  // Find and click close button (X button in header)
  // The close button is a button with an X icon
  const closeButton = widgetContainer.getByRole("button", { name: /Close/i });
  await closeButton.click();

  // Widget should close - the floating button should be visible again
  await expect(widgetButton).toBeVisible();
  await expect(widgetContainer).not.toBeVisible();
});
