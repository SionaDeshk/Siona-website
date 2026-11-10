import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Operations requires internal access and rejects cross-origin writes", async ({
  page,
  request,
}) => {
  await page.goto("/workspace/operations");
  await expect(page).toHaveURL(/\/workspace\/login/);
  expect([401, 503]).toContain((await request.get("/api/operations")).status());
  expect(
    (
      await request.post("/api/operations", {
        headers: { Origin: "https://attacker.example" },
        data: { action: "request" },
      })
    ).status(),
  ).toBe(403);
});
test("rehearsal walks a request through handoff and lot recording without making live writes", async ({
  page,
}) => {
  const liveWrites: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/operations") && r.method() === "POST")
      liveWrites.push(r.url());
  });
  await page.goto("/workspace/operations/preview");
  await expect(
    page.getByText("Interactive preview · fictional records"),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Operations workspace" })
    .getByRole("button", { name: "Requests" })
    .click();
  const detail = page.getByRole("region", { name: "Request details" });
  for (const stage of ["Ready", "Coordinating", "Completed"]) {
    await detail.getByRole("button", { name: "Update coordination" }).click();
    await page.getByLabel("Next stage").selectOption(stage);
    await page
      .getByLabel("Update / reason")
      .fill("Fictional workflow rehearsal completed.");
    if (stage !== "Ready")
      await page
        .getByLabel("External partner handoff reference")
        .fill("DEMO-PARTNER-01");
    if (stage === "Completed") {
      await page.getByRole("button", { name: "Save in preview" }).click();
      await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
        "supplied lot",
      );
      await page.getByLabel("Supply lot reference").fill("DEMO-LOT-01");
      await page.getByLabel("Supply lot expiry").fill("2099-12-31");
    }
    await page.getByRole("button", { name: "Save in preview" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(detail.getByText(stage, { exact: true })).toBeVisible();
  }
  await expect(detail.getByText("DEMO-LOT-01 / Dec 31, 2099")).toBeVisible();
  expect(liveWrites).toEqual([]);
  await page.reload();
  await page
    .getByRole("navigation", { name: "Operations workspace" })
    .getByRole("button", { name: "Requests" })
    .click();
  await expect(detail.getByText("Review", { exact: true })).toBeVisible();
});
test("practice creation and consumer filters work on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/workspace/operations/preview");
  await page.getByRole("button", { name: "Add a practice" }).click();
  await page.getByLabel("Legal practice name").fill("Rehearsal Practice");
  await page.getByLabel("Practice state").selectOption("TX");
  await page.getByLabel("Operations email").fill("demo@example.com");
  await page
    .getByLabel("Service scope and onboarding requirements")
    .fill("Fictional business onboarding scope for this rehearsal.");
  await page.getByRole("button", { name: "Save in preview" }).click();
  await page
    .getByRole("navigation", { name: "Operations workspace" })
    .getByRole("button", { name: "Practices" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Rehearsal Practice" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Operations workspace" })
    .getByRole("button", { name: "Requests" })
    .click();
  await page
    .getByRole("combobox", { name: "Channel", exact: true })
    .selectOption("Consumer");
  await expect(
    page.getByRole("region", { name: "Request details" }),
  ).toContainText("Consumer channel planning");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Operations preview has no automated WCAG AA violations across its views", async ({
  page,
}) => {
  await page.goto("/workspace/operations/preview");
  for (const tab of [
    "Command center",
    "Practices",
    "Catalog",
    "Requests",
    "Activity",
  ]) {
    await page
      .getByRole("navigation", { name: "Operations workspace" })
      .getByRole("button", { name: tab })
      .click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      tab,
    ).toEqual([]);
  }
});
