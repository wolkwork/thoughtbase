import { expect, test } from "@playwright/test";
import { createTestUser, generateTestEmail } from "../helpers/auth";

test("should successfully login with valid credentials", async ({ page }) => {
  // Create a user programmatically
  const { email: testEmail, password: testPassword } = await createTestUser();

  // Clear cookies to simulate logout (user was auto-logged in after creation)
  await page.context().clearCookies();

  // Now test login
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Email" }).fill(testEmail);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Login", exact: true }).click();

  // Check loading state during login
  await expect(page.getByRole("button", { name: "Logging in..." })).toBeVisible();

  // Should redirect to dashboard after successful login
  await page.waitForURL("/dashboard", { timeout: 10000 });
});

test("should show error when login fails", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("textbox", { name: "Email" }).fill(generateTestEmail());
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("wrongpassword");
  await page.getByRole("button", { name: "Login", exact: true }).click();

  // Should show error message
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible({
    timeout: 5000,
  });

  // Should still be on login page
  await expect(
    page.getByRole("heading", { name: "Welcome back to Thoughtbase" }),
  ).toBeVisible();
});
