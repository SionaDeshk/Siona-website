import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public navigation reaches substantive audience and vision sections", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", {
      name: isMobile ? "Mobile navigation" : "Main navigation",
      exact: true,
    })
    .getByRole("link", { name: "Who we serve" })
    .click();
  await expect(page).toHaveURL(/#pathways$/);
  await expect(
    page.getByRole("heading", { name: "Who we serve", exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "For research partners." }),
  ).toBeVisible();
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", {
      name: isMobile ? "Mobile navigation" : "Main navigation",
      exact: true,
    })
    .getByRole("link", { name: "Vision", exact: true })
    .click();
  await expect(
    page.getByText(
      "We want to make the connections between people, research, and institutions more useful.",
      { exact: false },
    ),
  ).toBeInViewport();
});

test("scientific forms animate and respect reduced-motion preferences", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const path of ["/", "/biologics"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const first = await page
      .locator("canvas.signal-engine")
      .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let n = 0;
          const step = () => {
            if (++n === 12) resolve();
            else requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }),
    );
    expect(
      await page
        .locator("canvas.signal-engine")
        .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    ).not.toBe(first);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/biologics", { waitUntil: "networkidle" });
  const still = await page
    .locator("canvas.signal-engine")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let n = 0;
        const step = () => {
          if (++n === 12) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
  );
  expect(
    await page
      .locator("canvas.signal-engine")
      .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
  ).toBe(still);
});

test("private workspace fails closed and the development preview is explicitly synthetic", async ({
  page,
  request,
}) => {
  await page.goto("/workspace/intelligence");
  await expect(page).toHaveURL(/\/workspace\/login/);
  await expect(
    page.getByRole("heading", { name: "From evidence to action." }),
  ).toBeVisible();
  const api = await request.get("/api/intelligence");
  expect([401, 503]).toContain(api.status());
  expect(await api.text()).not.toContain("SYNTHETIC");
  const cross = await request.post("/api/intelligence", {
    headers: { Origin: "https://attacker.example" },
    data: { operation: "seed_demo" },
  });
  expect(cross.status()).toBe(403);
  await page.goto("/workspace/intelligence/preview");
  await expect(
    page.getByText("Synthetic design preview · no live business data"),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Intelligence workspace" })
    .getByRole("button", { name: "Opportunities" })
    .click();
  await expect(
    page.getByRole("group", { name: "Interactive opportunity network" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Inspect Signal: SYNTHETIC · Documentation gaps in research procurement",
    })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Record details" })
      .getByRole("link", { name: "Original source" }),
  ).toHaveAttribute("href", "https://example.com/synthetic-signal");
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(
    page.getByRole("button", { name: "New hypothesis +" }),
  ).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("workspace preview has no automated WCAG AA violations", async ({
  page,
}) => {
  await page.goto("/workspace/intelligence/preview");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
