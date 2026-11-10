import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const future = () =>
  new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
async function save(page: import("@playwright/test").Page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save in preview", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
test("supply desk requires internal membership and same-origin mutations", async ({
  page,
  request,
}) => {
  await page.goto("/workspace/commerce");
  await expect(page).toHaveURL(/\/workspace\/login/);
  expect([401, 503]).toContain((await request.get("/api/commerce")).status());
  expect(
    (
      await request.post("/api/commerce", {
        headers: { Origin: "https://attacker.example" },
        data: { action: "rfq" },
      })
    ).status(),
  ).toBe(403);
});
test("supply rehearsal goes from reviewed quote to a traced delivery without live writes", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/commerce") && r.method() === "POST")
      writes.push(r.url());
  });
  await page.goto("/workspace/commerce/preview");
  await expect(
    page.getByText("Interactive supply preview · fictional records"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByLabel("Quote status").selectOption("Shared");
  await page
    .getByLabel("Pricing review / reason")
    .fill("Reviewed all fictional commercial charges and source terms.");
  await save(page);
  await page
    .getByRole("button", {
      name: "Accept for internal coordination",
      exact: true,
    })
    .click();
  await page.getByRole("checkbox").check();
  await page
    .getByLabel("Acceptance reasoning")
    .fill("Accepted the fictional quoted terms for this rehearsal.");
  await save(page);
  await page.getByRole("button", { name: "Mark Ready" }).click();
  await page
    .getByLabel("Operational review / outcome")
    .fill("Current operating reviews and accepted terms are complete.");
  await save(page);
  await page
    .getByRole("navigation", { name: "Supply desk" })
    .getByRole("button", { name: "Fulfillment" })
    .click();
  await page.getByRole("button", { name: "Record partner handoff" }).click();
  await page
    .getByLabel("Internal partner handoff reference")
    .fill("DEMO-HANDOFF");
  await page.getByLabel("Practice-visible carrier").fill("Fictional carrier");
  await page
    .getByLabel("Practice-visible tracking reference")
    .fill("DEMO-NEW-TRACK");
  await page.getByLabel("Expected delivery date").fill(future());
  await page
    .getByLabel("Handoff record / confirmation")
    .fill("A fictional partner handoff was documented.");
  await save(page);
  await page.getByRole("button", { name: "Record lot" }).click();
  await page.getByLabel("Exact lot identifier").fill("DEMO-NEW-LOT");
  await page.getByLabel("Lot expiry").fill(future());
  await page.getByLabel("Lot quantity").fill("4");
  await save(page);
  for (const status of ["Dispatched", "Delivered"]) {
    await page.getByRole("button", { name: "Record progress" }).click();
    await page.getByLabel("Shipment status").selectOption(status);
    await page
      .getByLabel("Practice-visible progress update")
      .fill("Fictional observed shipment progress for this rehearsal.");
    await save(page);
  }
  await page
    .getByRole("button", { name: "Record completion", exact: true })
    .click();
  await page
    .getByLabel("Operational review / outcome")
    .fill("All fictional units were delivered with lot records.");
  await save(page);
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  expect(writes).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("practice quote decisions show totals and preserve view-only restrictions", async ({
  page,
}) => {
  await page.goto("/practice/preview");
  await page
    .getByRole("navigation", { name: "Practice portal" })
    .getByRole("button", { name: "Requests" })
    .click();
  await page
    .getByRole("region", { name: "Practice requests" })
    .getByRole("button", { name: /Example supply quote/ })
    .click();
  const quote = page.getByRole("region", { name: "Practice quote" });
  await expect(quote).toContainText("30.00");
  await quote
    .getByRole("button", { name: "Accept quote for coordination" })
    .click();
  await page
    .getByRole("checkbox", {
      name: "I accept these quoted terms for coordination.",
    })
    .check();
  await page.getByRole("button", { name: "Save decision in preview" }).click();
  await expect(quote.getByText("Accepted", { exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Practice location" })
    .selectOption({ label: "Example West · fictional · CA" });
  await expect(
    page.getByRole("region", { name: "Practice quote" }),
  ).toHaveCount(0);
});
test("recall rehearsal matches a recorded lot and requires all follow-ups before closure", async ({
  page,
}) => {
  await page.goto("/workspace/commerce/preview");
  await page
    .getByRole("navigation", { name: "Supply desk" })
    .getByRole("button", { name: "Follow-ups" })
    .click();
  await page.getByRole("button", { name: "Open recall follow-up" }).click();
  await page
    .getByLabel("Source supplier")
    .selectOption({ label: "Example Supply Partner · fictional" });
  await page
    .getByLabel("Exact affected lot identifier")
    .fill("DEMO-RECALL-LOT");
  await page.getByLabel("Recall source reference").fill("DEMO-RECALL");
  await page
    .getByLabel("Recall evidence URL")
    .fill("https://example.com/fictional-recall");
  await page
    .getByLabel("Internal findings")
    .fill("A fictional source case was recorded for a traceability rehearsal.");
  await page
    .getByLabel("Practice-visible follow-up message")
    .fill("A fictional lot follow-up needs review with Operations.");
  await save(page);
  await page
    .getByRole("button", { name: "Close recall follow-up", exact: true })
    .click();
  await page
    .getByLabel("Case resolution")
    .fill("Attempted closure before all practice follow-ups were resolved.");
  await page
    .getByRole("button", { name: "Save in preview", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Resolve every",
  );
  await page.getByRole("button", { name: "Close form" }).click();
  await page
    .getByRole("button", { name: "Resolve follow-up", exact: true })
    .click();
  await page
    .getByLabel("Internal resolution")
    .fill("The fictional practice follow-up and disposition were documented.");
  await page
    .getByLabel("Practice-visible resolution")
    .fill("Your fictional supply follow-up has a recorded resolution.");
  await save(page);
  await page
    .getByRole("button", { name: "Close recall follow-up", exact: true })
    .click();
  await page
    .getByLabel("Case resolution")
    .fill("Every fictional affected practice follow-up was resolved.");
  await save(page);
  await expect(page.getByText("Closed", { exact: true })).toBeVisible();
});
test("supply desk and quote forms pass automated WCAG AA checks", async ({
  page,
}) => {
  await page.goto("/workspace/commerce/preview");
  for (const name of ["Quotes", "Fulfillment", "Follow-ups"]) {
    await page
      .getByRole("navigation", { name: "Supply desk" })
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
});
