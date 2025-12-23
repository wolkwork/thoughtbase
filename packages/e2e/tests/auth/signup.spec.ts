import { expect, test } from "@playwright/test";
import {
  createTestUser,
  generateTestEmail,
  generateTestName,
  generateTestPassword,
} from "../helpers/auth";

test("should show error when passwords do not match", async ({ page }) => {
  await page.goto("/signup");

  await page.getByRole("textbox", { name: "Name" }).fill("Test User");
  await page.getByRole("textbox", { name: "Email" }).fill(generateTestEmail());
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
  await page.getByRole("textbox", { name: "Confirm Password" }).fill("differentpassword");

  await page.getByRole("button", { name: "Sign up" }).click();

  // Wait for toast error message
  await expect(page.getByText("Passwords do not match.")).toBeVisible();

  // Form should not submit (should still be on signup page)
  await expect(
    page.getByRole("heading", { name: "Sign up for Thoughtbase" }),
  ).toBeVisible();
});

test("should successfully sign up with valid credentials", async ({ page }) => {
  const testEmail = generateTestEmail();
  const testPassword = generateTestPassword();
  const testName = generateTestName();

  await page.goto("/signup");

  // Fill in the form
  await page.getByRole("textbox", { name: "Name" }).fill(testName);
  await page.getByRole("textbox", { name: "Email" }).fill(testEmail);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(testPassword);
  await page.getByRole("textbox", { name: "Confirm Password" }).fill(testPassword);

  // Submit the form
  await page.getByRole("button", { name: "Sign up" }).click();

  // Check that button shows loading state
  await expect(page.getByRole("button", { name: "Signing up..." })).toBeVisible();

  await page.waitForURL("/dashboard");
});

test("should show error when email already exists", async ({ page }) => {
  // Create a user programmatically
  const { email: testEmail, password: testPassword } = await createTestUser();
  const secondName = generateTestName();

  await page.context().clearCookies();

  // Try to sign up again with the same email
  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name" }).fill(secondName);
  await page.getByRole("textbox", { name: "Email" }).fill(testEmail);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(testPassword);
  await page.getByRole("textbox", { name: "Confirm Password" }).fill(testPassword);
  await page.getByRole("button", { name: "Sign up" }).click();

  // Should show error message (better-auth returns specific error or fallback message)
  await expect(page.getByText(/user already exists/i)).toBeVisible({
    timeout: 5000,
  });
});

test("should navigate between signup and login pages", async ({ page }) => {
  await page.goto("/signup");

  await page.getByRole("link", { name: "Login" }).click();

  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back to Thoughtbase" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Sign up" }).click();

  await expect(page).toHaveURL("/signup");
  await expect(
    page.getByRole("heading", { name: "Sign up for Thoughtbase" }),
  ).toBeVisible();
});
