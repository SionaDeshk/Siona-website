import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const path = "/workspace/intelligence/preview/device-information";

test("device explainer connects parts to exact identity and preserves evidence gaps without writes", async ({
  page,
}) => {
  const writes: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => {
    if (!["GET", "HEAD"].includes(r.method())) writes.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/workspace/intelligence/preview");
  await page
    .getByRole("link", { name: /Open the knee-device information prototype/ })
    .click();
  await expect(page).toHaveURL(new RegExp(path));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Understand the parts.",
  );
  const controls = page.getByRole("group", { name: "Explore knee components" });
  const detail = page.getByRole("region", { name: "Selected component" });
  await expect(
    controls.getByRole("button", { name: /Femoral component/ }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const name of [
    "Bearing insert",
    "Tibial baseplate",
    "Femoral component",
  ]) {
    const button = controls.getByRole("button", { name: new RegExp(name) });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      detail.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(controls.locator('[aria-pressed="true"]')).toHaveCount(1);
    if (name !== "Femoral component")
      await expect(detail).toContainText("No exact");
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await expect(page.getByText("42-5026-066-02", { exact: true })).toBeVisible();
  await expect(page.getByText("00889024230408", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Check the original AccessGUDID/ }),
  ).toHaveAttribute(
    "href",
    "https://accessgudid.nlm.nih.gov/devices/00889024230408",
  );
  await page
    .getByText("What do these numbers tell me?", { exact: true })
    .click();
  await expect(
    page.getByText("A separate production identifier.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Important questions remain open." }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "That this whole knee system is recall-free." })
    .check();
  await expect(page.getByRole("status")).toContainText(
    "does not recommend an implant or establish complete recall coverage",
  );
  await page
    .getByRole("radio", {
      name: "How to identify one component and the questions still to resolve.",
    })
    .check();
  await expect(page.getByRole("status")).toContainText("Exactly.");
  await page.reload();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  expect(writes.filter((url) => !url.includes("__nextjs"))).toEqual([]);
  expect(errors).toEqual([]);
});

test("device explainer has no automated WCAG AA violations across component selections", async ({
  page,
}) => {
  await page.goto(path);
  for (const name of [
    "Femoral component",
    "Bearing insert",
    "Tibial baseplate",
  ]) {
    await page
      .getByRole("group", { name: "Explore knee components" })
      .getByRole("button", { name: new RegExp(name) })
      .click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      name,
    ).toEqual([]);
  }
});
