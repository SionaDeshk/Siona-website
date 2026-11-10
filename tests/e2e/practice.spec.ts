import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("practice routes require authentication and deny cross-origin mutations", async ({
  page,
  request,
}) => {
  await page.goto("/practice");
  await expect(page).toHaveURL(/\/practice\/login/);
  await expect(
    page.getByRole("heading", { name: "Your practice. Connected." }),
  ).toBeVisible();
  expect([401, 503]).toContain((await request.get("/api/practice")).status());
  const cross = await request.post("/api/practice", {
    headers: { Origin: "https://attacker.example" },
    data: { action: "submit" },
  });
  expect(cross.status()).toBe(403);
});
test("practice rehearsal submits and cancels a request without live writes", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/api/practice"))
      writes.push(r.url());
  });
  await page.goto("/practice/preview");
  await expect(
    page.getByText("Interactive practice preview · fictional records"),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Practice portal" })
    .getByRole("button", { name: "Catalog" })
    .click();
  await page
    .getByRole("button", { name: "Request coordination", exact: true })
    .click();
  await page.getByLabel("Quantity").fill("3");
  await page
    .getByLabel("Requested date")
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel("Practice reference").fill("DEMO-NEW-REQUEST");
  await page
    .getByLabel("Business requirements")
    .fill("Fictional business supply requirements.");
  await page.getByRole("button", { name: "Save in preview" }).click();
  const detail = page.getByRole("region", { name: "Practice request details" });
  await expect(detail).toContainText("DEMO-NEW-REQUEST");
  await expect(detail.getByText("Submitted", { exact: true })).toBeVisible();
  await detail
    .getByRole("button", { name: "Cancel request", exact: true })
    .click();
  await page
    .getByLabel("Business reason for cancellation")
    .fill("The fictional practice no longer needs this supply.");
  await page.getByRole("button", { name: "Save in preview" }).click();
  await expect(detail.getByText("Cancelled", { exact: true })).toBeVisible();
  expect(writes).toEqual([]);
  await page.reload();
  await expect(page.getByText("DEMO-NEW-REQUEST")).toHaveCount(0);
});
test("location switching changes the catalog and request list and respects view-only access", async ({
  page,
}) => {
  await page.goto("/practice/preview");
  await page
    .getByRole("combobox", { name: "Practice location" })
    .selectOption({ label: "Example West · fictional · CA" });
  await expect(page.getByText("CA / View only", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Practice portal" })
    .getByRole("button", { name: "Catalog" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Example west supply kit · fictional" }),
  ).toBeVisible();
  await expect(
    page.getByText("Example sample container · fictional", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Request coordination", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Practice portal" })
    .getByRole("button", { name: "Requests" })
    .click();
  await expect(
    page.getByRole("region", { name: "Practice request details" }),
  ).toContainText("On hold");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("practice preview and request form meet automated WCAG AA checks", async ({
  page,
}) => {
  await page.goto("/practice/preview");
  for (const name of ["Overview", "Requests", "Catalog"]) {
    await page
      .getByRole("navigation", { name: "Practice portal" })
      .getByRole("button", { name })
      .click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      name,
    ).toEqual([]);
  }
  await page
    .getByRole("button", { name: "Request coordination", exact: true })
    .click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
