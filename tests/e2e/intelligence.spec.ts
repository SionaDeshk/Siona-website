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

const scientificScenes = [
  { path: "/", selector: ".signal-engine-group", name: "globe" },
  { path: "/", selector: ".signal-engine-approach", name: "connection" },
  { path: "/", selector: ".signal-engine-vision", name: "neuron" },
  { path: "/biologics", selector: ".signal-engine-bio", name: "DNA" },
];

async function waitForFrames(
  page: import("@playwright/test").Page,
  count = 12,
) {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let frames = 0;
        const step = () =>
          ++frames === count ? resolve() : requestAnimationFrame(step);
        requestAnimationFrame(step);
      }),
    count,
  );
}

test("all four scientific illustrations animate and can be paused independently", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let currentPath = "";
  for (const scene of scientificScenes) {
    if (scene.path !== currentPath) {
      await page.goto(scene.path, { waitUntil: "load" });
      currentPath = scene.path;
    }
    const canvas = page.locator(scene.selector);
    await canvas.scrollIntoViewIfNeeded();
    await waitForFrames(page);
    const snapshot = () =>
      canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    const first = await snapshot();
    await waitForFrames(page);
    expect(await snapshot()).not.toBe(first);
    await page
      .getByRole("button", { name: `Pause ${scene.name} motion`, exact: true })
      .click();
    const resume = page.getByRole("button", {
      name: `Resume ${scene.name} motion`,
      exact: true,
    });
    await expect(resume).toHaveAttribute("aria-pressed", "true");
    const paused = await snapshot();
    await waitForFrames(page);
    expect(await snapshot()).toBe(paused);
    await resume.click();
    await waitForFrames(page);
    expect(await snapshot()).not.toBe(paused);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("reduced motion keeps every illustration static during scrolling and pointer movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let currentPath = "";
  for (const scene of scientificScenes) {
    if (scene.path !== currentPath) {
      await page.goto(scene.path, { waitUntil: "load" });
      currentPath = scene.path;
    }
    const canvas = page.locator(scene.selector);
    await canvas.scrollIntoViewIfNeeded();
    await waitForFrames(page);
    const snapshot = () =>
      canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    const still = await snapshot();
    await page.mouse.move(230, 320);
    await page.evaluate(() => window.scrollBy(0, 70));
    await waitForFrames(page);
    expect(await snapshot()).toBe(still);
    await expect(
      page.getByRole("button", {
        name: `Pause ${scene.name} motion`,
        exact: true,
      }),
    ).toBeHidden();
  }
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
