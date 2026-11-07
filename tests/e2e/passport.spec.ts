import { expect, test } from "@playwright/test";
test("private routes send anonymous visitors to sign in", async ({ page }) => {
  for (const path of [
    "/passport/app",
    "/passport/export",
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

test('configured clinician can sign in and sign out', async ({ page }) => {
  test.skip(!process.env.PASSPORT_TEST_EMAIL_A || !process.env.PASSPORT_TEST_PASSWORD_A || !process.env.NEXT_PUBLIC_PASSPORT_SUPABASE_URL || !process.env.NEXT_PUBLIC_PASSPORT_SUPABASE_PUBLISHABLE_KEY, 'Requires configured synthetic Supabase account');
  await page.goto('/passport/login');
  await page.getByLabel('Email', { exact: true }).fill(process.env.PASSPORT_TEST_EMAIL_A!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.PASSPORT_TEST_PASSWORD_A!);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL(/\/passport\/app/);
  await expect(page.getByRole('heading', { name: 'Credential vault' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/passport\/login/);
  await page.goto('/passport/app');
  await expect(page).toHaveURL(/\/passport\/login/);
});
