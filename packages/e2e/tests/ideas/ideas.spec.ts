import { expect, test } from "@playwright/test";
import { createTestUser, loginUser } from "../helpers/auth";
import { createTestIdea } from "../helpers/ideas";

test("should create idea and view it in the list", async ({ page }) => {
  // Create user and login
  const { email, password } = await createTestUser();
  await page.context().clearCookies();
  await loginUser(page, email, password);

  await page.waitForLoadState("networkidle");

  // Open create idea dialog
  await page.getByRole("button", { name: "Create Idea" }).click();

  // Fill in the form
  const ideaTitle = `Test Idea ${Date.now()}`;
  const ideaDescription = "This is a test idea description";

  await page.getByRole("textbox", { name: "Title" }).fill(ideaTitle);
  await page.getByRole("textbox", { name: "Description" }).fill(ideaDescription);

  // Submit and check loading state
  await page.getByRole("button", { name: "Create Request" }).click();
  // TODO: loading indicator
  // await expect(page.getByRole("button", { name: "Creating..." })).toBeVisible();

  // Wait for success message
  await expect(page.getByText("Idea created successfully")).toBeVisible();

  await expect(page).toHaveURL(/\/dashboard\/[^/]+\/ideas\/[a-zA-Z0-9-]+/);

  // Dialog should close and idea should appear in the list
  await expect(page.getByText(ideaTitle)).toBeVisible();
});

test.fixme("should edit the idea", () => {});

test("should update idea status", async ({ page }) => {
  // Create user and login
  const { email, password } = await createTestUser();
  await page.context().clearCookies();
  const { orgSlug, cookies } = await loginUser(page, email, password);

  // Create an idea programmatically
  const ideaTitle = `Test Idea ${Date.now()}`;
  const idea = await createTestIdea({
    organizationSlug: orgSlug,
    title: ideaTitle,
    cookies,
  });

  // Navigate to idea detail page
  await page.goto(`/dashboard/${orgSlug}/ideas/${idea.id}`);

  // Update status to "In Progress"
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "In Progress" }).click();
  await expect(page.getByText("Status updated")).toBeVisible();
  await expect(page.getByRole("combobox", { name: /Status/i })).toHaveText(
    /In Progress/i,
  );
});

test("should post a comment on an idea", async ({ page }) => {
  // Create user and login
  const { email, password } = await createTestUser();
  await page.context().clearCookies();
  const { orgSlug, cookies } = await loginUser(page, email, password);

  // Create an idea programmatically
  const ideaTitle = `Test Idea ${Date.now()}`;
  const idea = await createTestIdea({
    organizationSlug: orgSlug,
    title: ideaTitle,
    cookies,
  });

  // Navigate to idea detail page
  await page.goto(`/dashboard/${orgSlug}/ideas/${idea.id}`);

  // Add a comment
  const commentText = "This is a test comment";
  await page.getByPlaceholder("Write a comment...").fill(commentText);
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Comment added")).toBeVisible();
  await expect(page.getByText(commentText)).toBeVisible();
});

test("should delete an idea", async ({ page }) => {
  // Create user and login
  const { email, password } = await createTestUser();
  await page.context().clearCookies();
  const { orgSlug, cookies } = await loginUser(page, email, password);

  // Create an idea programmatically
  const ideaTitle = `Test Idea ${Date.now()}`;
  const idea = await createTestIdea({
    organizationSlug: orgSlug,
    title: ideaTitle,
    cookies,
  });

  // Navigate to idea detail page
  await page.goto(`/dashboard/${orgSlug}/ideas/${idea.id}`);

  await page.waitForLoadState("networkidle");

  // Set up dialog handler before clicking delete
  page.on("dialog", (dialog) => {
    expect(dialog.message()).toMatch(/Are you sure/i);
    dialog.accept();
  });

  // Delete the idea (trash icon button)
  await page.getByRole("button", { name: /delete idea/i }).click();

  // Wait for success message
  await expect(page.getByText(/Idea deleted/i)).toBeVisible({ timeout: 5000 });

  // Should be redirected back to ideas list
  await page.waitForURL(/\/dashboard\/.*\/ideas/, { timeout: 5000 });

  // Idea should no longer be in the list
  await expect(page.getByText(ideaTitle)).not.toBeVisible();
});
