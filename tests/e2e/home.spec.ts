import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("meets automated WCAG 2.2 AA checks", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("homepage is complete, responsive, and keyboard accessible", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("SIONA — The path is the way.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Building\s*what[’']s next\./);
  await expect(page.getByRole("heading", { name: "Connected by design." })).toBeVisible();
  await expect(page.getByText("© 2026 Siona Group LLC. All rights reserved.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (isMobile) {
    const menu = page.getByRole("button", { name: "Open navigation" });
    await menu.click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await menu.click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "About" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();
    await expect(page).toHaveURL(/#about$/);
  } else {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  }
  expect(errors).toEqual([]);
});

test("form validates accessibly and preserves text after a server failure", async ({ page }) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("textbox", { name: /^Name/ })).toBeFocused();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await page.getByRole("textbox", { name: /^Name/ }).fill("Test Person");
  await page.getByRole("textbox", { name: /^Email/ }).fill("test@example.com");
  await page.getByRole("textbox", { name: /^Message/ }).fill("This is a test inquiry for Siona.");
  await page.route("/api/contact", async route => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Contact is temporarily unavailable. Please try again shortly." }) });
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Contact is temporarily unavailable");
  await expect(page.getByRole("textbox", { name: /^Message/ })).toHaveValue("This is a test inquiry for Siona.");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
});

test("confirmed success clears the form and allows a new conversation", async ({ page }) => {
  await page.route("/api/contact", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(route.request().method() === "GET" ? { token: "browser-test", readyAt: Date.now() } : { message: "Your message has been sent." }),
    });
  });
  await page.goto("/#contact");
  await page.getByRole("textbox", { name: /^Name/ }).fill("Test Person");
  await page.getByRole("textbox", { name: /^Email/ }).fill("test@example.com");
  await page.getByRole("textbox", { name: /^Message/ }).fill("This is a test inquiry for Siona.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message received." })).toBeVisible();
  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(page.getByRole("textbox", { name: /^Name/ })).toHaveValue("");
});
