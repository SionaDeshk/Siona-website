import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const fixture = "http://127.0.0.1:54331";
test.beforeEach(async ({ page, request }) => {
  await request.post(`${fixture}/control/reset`);
  await page.goto("/passport/login");
  await page.getByLabel("Email", { exact: true }).fill("fixture@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-only-password");
  await page.getByRole("button", { name: "Sign in →" }).click();
  await expect(page).toHaveURL(/\/passport\/app/);
});
test("CE save failure preserves entries and a successful retry resets the add form", async ({
  page,
  request,
}) => {
  const section = page.locator("#ce_entries");
  await section.getByText("Add CE learning +", { exact: true }).click();
  const form = section.locator("form.credential-form").first();
  await form.getByLabel("title", { exact: true }).fill("Retry course");
  await form.getByLabel("provider", { exact: true }).fill("Retry Provider");
  await form.getByLabel("hours", { exact: true }).fill("3.25");
  await form.getByLabel("completed on", { exact: true }).fill("2026-02-01");
  await request.post(`${fixture}/control/fail-next`, {
    data: { operation: "passport_ce_entries" },
  });
  await form.getByRole("button", { name: "Save learning" }).click();
  await expect(form.getByRole("alert")).toContainText(
    "Your entries are still here",
  );
  await expect(form.getByLabel("title", { exact: true })).toHaveValue(
    "Retry course",
  );
  await expect(form.getByLabel("hours", { exact: true })).toHaveValue("3.25");
  await form.getByRole("button", { name: "Save learning" }).click();
  await expect(form.getByRole("status")).toHaveText("Record saved.");
  await expect(
    section.getByRole("heading", { name: "Retry course" }),
  ).toBeVisible();
  await expect(form.getByLabel("title", { exact: true })).toHaveValue("");
});
test("reversed dates produce an accessible inline error and preserve the license", async ({
  page,
}) => {
  const section = page.locator("#licenses");
  await section.getByText("Add a license +", { exact: true }).click();
  const form = section.locator("form.credential-form").first();
  await form.getByLabel("jurisdiction", { exact: true }).fill("AK");
  await form.getByLabel("issued on", { exact: true }).fill("2026-02-02");
  await form.getByLabel("expires on", { exact: true }).fill("2026-01-01");
  await form.getByRole("button", { name: "Save license" }).click();
  await expect(form.getByLabel("jurisdiction", { exact: true })).toHaveValue(
    "AK",
  );
  await expect(form.getByLabel("expires on", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    form.getByText("Expiry must be on or after issue date"),
  ).toBeVisible();
  await expect(form.getByLabel("expires on", { exact: true })).toBeFocused();
});
test("profile failure preserves the display name", async ({
  page,
  request,
}) => {
  const form = page.getByRole("textbox", { name: "Display name" });
  await form.fill("Updated Nurse");
  await request.post(`${fixture}/control/fail-next`, {
    data: { operation: "passport_profiles" },
  });
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Your entry is still here",
  );
  await expect(form).toHaveValue("Updated Nurse");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toHaveText("Profile saved.");
});
test("upload retry keeps the selected file and credential, with links in both directions", async ({
  page,
  request,
}) => {
  const vault = page.locator("#documents");
  const form = vault.locator("form.credential-form");
  const value = "ce_entries:22222222-2222-4222-8222-222222222222";
  await form
    .getByLabel("Link to a credential", { exact: true })
    .selectOption(value);
  await form.locator("input[type=file]").setInputFiles({
    name: "retry-certificate.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nsynthetic"),
  });
  await request.post(`${fixture}/control/fail-next`, {
    data: { operation: "storage" },
  });
  await form.getByRole("button", { name: "Upload privately" }).click();
  await expect(form.getByRole("alert")).toContainText(
    "Your selection is still here",
  );
  await expect(
    form.getByLabel("Link to a credential", { exact: true }),
  ).toHaveValue(value);
  await expect(form.getByText(/Selected: retry-certificate.pdf/)).toBeVisible();
  await form.getByRole("button", { name: "Upload privately" }).click();
  await expect(form.getByRole("status")).toHaveText(
    "Document uploaded privately.",
  );
  const doc = vault.locator("article").filter({
    has: page.getByRole("link", {
      name: "retry-certificate.pdf ↗",
      exact: true,
    }),
  });
  await expect(
    doc.getByRole("link", {
      name: "CE · Synthetic course · 2026-01-01",
      exact: true,
    }),
  ).toBeVisible();
  const record = page.locator(
    "#credential-22222222-2222-4222-8222-222222222222",
  );
  await expect(
    record.getByRole("link", { name: "retry-certificate.pdf", exact: true }),
  ).toBeVisible();
});
test("deletion cancellation keeps the credential; accepting leaves its document unlinked", async ({
  page,
}) => {
  const record = page.locator(
    "#credential-22222222-2222-4222-8222-222222222222",
  );
  page.once("dialog", (dialog) => dialog.dismiss());
  await record.getByRole("button", { name: "Delete record" }).click();
  await expect(record).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await record.getByRole("button", { name: "Delete record" }).click();
  await expect(record).toHaveCount(0);
  await expect(
    page
      .locator("#document-33333333-3333-4333-8333-333333333333")
      .getByText("No linked credential", { exact: true }),
  ).toBeVisible();
});
test("signed-in fixture dashboard passes automated accessibility checks", async ({
  page,
}) => {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("editing a credential preserves changed fields across a failed save", async ({
  page,
  request,
}) => {
  const record = page.locator(
    "#credential-22222222-2222-4222-8222-222222222222",
  );
  await record.getByText("Edit record", { exact: true }).click();
  const form = record.locator("form.credential-form");
  await form.getByLabel("title", { exact: true }).fill("Edited course");
  await form.getByLabel("hours", { exact: true }).fill("4.5");
  await request.post(`${fixture}/control/fail-next`, {
    data: { operation: "passport_ce_entries" },
  });
  await form.getByRole("button", { name: "Save learning" }).click();
  await expect(form.getByRole("alert")).toContainText(
    "Your entries are still here",
  );
  await expect(form.getByLabel("title", { exact: true })).toHaveValue(
    "Edited course",
  );
  await form.getByRole("button", { name: "Save learning" }).click();
  await expect(form.getByRole("status")).toHaveText("Record saved.");
  await expect(
    record.getByRole("heading", { name: "Edited course" }),
  ).toBeVisible();
  await expect(form.getByLabel("hours", { exact: true })).toHaveValue("4.5");
});
