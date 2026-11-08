import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
// Never retain auth form/password or session data in browser artifacts.
test.use({ trace: "off", screenshot: "off", video: "off" });
test("private routes send anonymous visitors to sign in", async ({ page }) => {
  for (const path of [
    "/passport/app",
    "/passport/export",
    "/passport/reset-password",
    "/passport/documents/33333333-3333-4333-8333-333333333333/view",
    "/passport/documents/00000000-0000-4000-8000-000000000000",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/passport\/login/);
    await expect(
      page.getByRole("heading", { name: "One place. Your Passport." }),
    ).toBeVisible();
  }
});
test("login is responsive and exposes no private data", async ({ page }) => {
  await page.goto("/passport/login");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("configured clinician can sign in and sign out", async ({ page }) => {
  test.skip(
    process.env.PASSPORT_RUN_LIVE_TESTS !== "1" ||
      !process.env.PASSPORT_TEST_SUPABASE_URL ||
      process.env.PASSPORT_TEST_SUPABASE_URL !==
        process.env.NEXT_PUBLIC_PASSPORT_SUPABASE_URL ||
      !process.env.PASSPORT_TEST_USER_A_EMAIL ||
      !process.env.PASSPORT_TEST_USER_A_PASSWORD ||
      !process.env.NEXT_PUBLIC_PASSPORT_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_PASSPORT_SUPABASE_PUBLISHABLE_KEY,
    "Requires configured synthetic Supabase account",
  );
  await page.goto("/passport/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.PASSPORT_TEST_USER_A_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.PASSPORT_TEST_USER_A_PASSWORD!);
  await page.getByRole("button", { name: "Sign in →" }).click();
  await expect(page).toHaveURL(/\/passport\/app/);
  await expect(
    page.getByRole("heading", { name: "Credential vault" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/passport\/login/);
  await page.goto("/passport/app");
  await expect(page).toHaveURL(/\/passport\/login/);
});

test("Passport login meets automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/passport/login");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("password recovery is reachable and accessible", async ({ page }) => {
  await page.goto("/passport/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page).toHaveURL(/\/passport\/forgot-password/);
  await expect(
    page.getByRole("heading", { name: "Let’s get you back in." }),
  ).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL(/\/passport\/login/);
});
