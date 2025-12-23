import { expect, test } from "@playwright/test";

const LANDING_PAGE_URL = "http://thoughtbase.localhost:4321";

test("should open widget and submit feedback", async ({ page }) => {
  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Find and click the widget button (button is outside shadow DOM)
  await page.getByRole("button", { name: "Submit Feedback" }).click();

  // Wait for widget modal to appear
  await expect(page.getByTestId("thoughtbase-widget")).toBeVisible();

  // Access shadow DOM to interact with widget content
  const widgetContainer = page.getByTestId("thoughtbase-widget");

  // Find textarea in shadow DOM
  const textarea = await widgetContainer.getByRole("textbox", {
    name: /Idea description/i,
  });

  // Type feedback using evaluate
  const feedbackText = `Test feedback ${Date.now()}`;

  await textarea.fill(feedbackText);
  await textarea.press("Enter");

  // Wait for success message
  await page.waitForTimeout(2000);
  await expect(page.getByText("Thanks for your feedback!")).toBeVisible();
});

test("should switch between widget tabs", async ({ page }) => {
  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Wait for widget to be initialized
  await page.waitForFunction(() => {
    return window.initFeedbackWidget !== undefined;
  });

  // Open widget
  const widgetButton = page
    .locator('button:has-text("Submit Feedback")')
    .first();
  await widgetButton.waitFor({ state: "visible", timeout: 5000 });
  await widgetButton.click();

  await page.waitForTimeout(500);
  const shadowHost = "#feedback-widget-container";

  // Switch to Roadmap tab
  await page.evaluate((hostSelector) => {
    const host = document.querySelector(hostSelector);
    if (host?.shadowRoot) {
      const roadmapTab = Array.from(
        host.shadowRoot.querySelectorAll("button")
      ).find((btn) =>
        btn.textContent?.includes("Roadmap")
      ) as HTMLButtonElement;
      if (roadmapTab) {
        roadmapTab.click();
      }
    }
  }, shadowHost);

  // Wait for roadmap to load
  await page.waitForTimeout(1000);

  // Switch to Updates tab
  await page.evaluate((hostSelector) => {
    const host = document.querySelector(hostSelector);
    if (host?.shadowRoot) {
      const updatesTab = Array.from(
        host.shadowRoot.querySelectorAll("button")
      ).find((btn) =>
        btn.textContent?.includes("Updates")
      ) as HTMLButtonElement;
      if (updatesTab) {
        updatesTab.click();
      }
    }
  }, shadowHost);

  // Wait for updates to load
  await page.waitForTimeout(1000);

  // Switch back to Feedback tab
  await page.evaluate((hostSelector) => {
    const host = document.querySelector(hostSelector);
    if (host?.shadowRoot) {
      const feedbackTab = Array.from(
        host.shadowRoot.querySelectorAll("button")
      ).find((btn) =>
        btn.textContent?.includes("Feedback")
      ) as HTMLButtonElement;
      if (feedbackTab) {
        feedbackTab.click();
      }
    }
  }, shadowHost);

  // Verify we're back on feedback tab
  await page.waitForTimeout(500);
  const isFeedbackTab = await page.evaluate((hostSelector) => {
    const host = document.querySelector(hostSelector);
    if (host?.shadowRoot) {
      return host.shadowRoot.textContent?.includes("Submit Idea");
    }
    return false;
  }, shadowHost);

  expect(isFeedbackTab).toBe(true);
});

test("should close widget", async ({ page }) => {
  await page.goto(LANDING_PAGE_URL);
  await page.waitForLoadState("networkidle");

  // Wait for widget to be initialized
  await page.waitForFunction(() => {
    return window.initFeedbackWidget !== undefined;
  });

  // Open widget
  const widgetButton = page
    .locator('button:has-text("Submit Feedback")')
    .first();
  await widgetButton.waitFor({ state: "visible", timeout: 5000 });
  await widgetButton.click();

  await page.waitForTimeout(500);
  const shadowHost = "#feedback-widget-container";

  // Find and click close button (X button in header)
  await page.evaluate((hostSelector) => {
    const host = document.querySelector(hostSelector);
    if (host?.shadowRoot) {
      // Find the close button (X icon) - it's usually in the header
      const closeButton = Array.from(
        host.shadowRoot.querySelectorAll("button")
      ).find((btn) => {
        const svg = btn.querySelector("svg");
        return svg !== null;
      }) as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  }, shadowHost);

  // Widget should close - the floating button should be visible again
  await page.waitForTimeout(500);
  await widgetButton.waitFor({ state: "visible", timeout: 2000 });
});
