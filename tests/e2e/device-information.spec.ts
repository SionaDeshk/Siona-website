import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ["--enable-unsafe-swiftshader"],
  },
});

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
    .click({ timeout: 20000 });
  await expect(page).toHaveURL(new RegExp(path), { timeout: 20000 });
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
  await expect(
    page
      .getByRole("region", { name: "Exact component identity" })
      .getByText("42-5026-066-02", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Exact component identity" })
      .getByText("00889024230408", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Check the original AccessGUDID/ }),
  ).toHaveAttribute(
    "href",
    "https://accessgudid.nlm.nih.gov/devices/00889024230408",
  );
  await page
    .getByText("What do these numbers tell me?", { exact: true })
    .click({ timeout: 20000 });
  await expect(
    page.getByText("A separate production identifier.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Important questions remain open." }),
  ).toBeVisible();
  // Exercise the full labeled touch target, avoiding the development toolbar
  // over the small native input at the bottom edge of the mobile viewport.
  await page
    .getByText("That this whole knee system is recall-free.", { exact: true })
    .click({ timeout: 20000 });
  await expect(
    page.getByRole("radio", {
      name: "That this whole knee system is recall-free.",
    }),
  ).toBeChecked();
  await expect(page.getByRole("status")).toContainText(
    "does not recommend an implant or establish complete recall coverage",
  );
  await page
    .getByText(
      "How to identify one component and the questions still to resolve.",
      { exact: true },
    )
    .click({ timeout: 20000 });
  await expect(
    page.getByRole("radio", {
      name: "How to identify one component and the questions still to resolve.",
    }),
  ).toBeChecked();
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

test("device explainer switches exact manufacturer records without inherited clearance or answers", async ({
  page,
}) => {
  await page.goto(path);
  await page
    .getByRole("group", { name: "Explore knee components" })
    .getByRole("button", { name: /Bearing insert/ })
    .click();
  await page
    .getByRole("radio", { name: "That this whole knee system is recall-free." })
    .check();
  const selector = page.getByRole("group", {
    name: "Choose manufacturer example",
  });
  const stryker = selector.getByRole("button", { name: /Stryker/ });
  await stryker.focus();
  await page.keyboard.press("Enter");
  await expect(stryker).toHaveAttribute("aria-pressed", "true");
  const identity = page.getByRole("region", {
    name: "Exact component identity",
  });
  await expect(identity).toContainText("5510-F-401");
  await expect(identity).toContainText("07613327040272");
  await expect(identity).not.toContainText("42-5026-066-02");
  await expect(identity.getByRole("link")).toHaveAttribute(
    "href",
    "https://accessgudid.nlm.nih.gov/devices/07613327040272",
  );
  const evidence = page.locator("#device-evidence");
  await expect(evidence).toContainText("Exact submission link unresolved");
  await expect(
    evidence.getByRole("link", { name: /FDA record K/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "Explore knee components" })
      .getByRole("button", { name: /Femoral component/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const comparison = page.getByRole("region", {
    name: "Manufacturer record comparison",
  });
  await expect(comparison).toContainText("Listed size — not equivalent");
  await expect(comparison).toContainText("Not yet verified");
  await comparison.focus();
  await page.keyboard.press("ArrowRight");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await selector.getByRole("button", { name: /Zimmer Biomet/ }).click();
  await expect(identity).toContainText("42-5026-066-02");
  await expect(
    evidence.getByRole("link", { name: /FDA record K/ }),
  ).toHaveCount(2);
  await page
    .getByRole("navigation", { name: "Device information sections" })
    .getByRole("link", { name: /Questions to ask/ })
    .click();
  await expect(page.locator("#device-questions")).toBeFocused();
});

test.describe("interactive knee illustrations", () => {
  test("each part rotates, isolates and exports a real GLB without server writes", async ({
    page,
  }) => {
    const errors: string[] = [],
      writes: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (!["GET", "HEAD"].includes(request.method()))
        writes.push(request.url());
    });
    await page.goto(path);
    await expect(
      page.getByRole("img", { name: "Three main parts of a knee replacement" }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Explore in 3D", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Reset view", exact: true }),
    ).toBeEnabled({ timeout: 20000 });
    await expect(page.locator("canvas")).toBeVisible();
    const canvas = page.locator("canvas");
    await canvas.click();
    await expect(
      page.getByRole("button", { name: "Pause spin", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const firstFrame = await canvas.screenshot();
    // Software WebGL screenshots can exceed the default five-second poll budget.
    // Wait for actual frame boundaries, then compare rendered pixels directly.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect((await canvas.screenshot()).equals(firstFrame)).toBe(false);
    await canvas.click();
    await expect(
      page.getByRole("button", { name: "Spin model", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Spin model", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Pause spin", exact: true }),
    ).toBeVisible();
    const box = await canvas.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box!.x + box!.width / 2 + 40,
      box!.y + box!.height / 2,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect(
      page.getByRole("button", { name: "Spin model", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Rotate model right" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.getByRole("button", { name: "Reset view", exact: true }).click();
    for (const [name, slug] of [
      ["Femoral component", "femoral"],
      ["Bearing insert", "bearing"],
      ["Tibial baseplate", "tibial"],
    ]) {
      await page
        .getByRole("group", { name: "Explore knee components" })
        .getByRole("button", { name: new RegExp(name) })
        .click();
      await expect(
        page.getByRole("img", { name: new RegExp(`^${name}, simplified 3D`) }),
      ).toBeVisible();
      const downloadEvent = page.waitForEvent("download");
      await page
        .getByRole("button", {
          name: new RegExp(`^Download ${name.toLowerCase()}`),
        })
        .click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toBe(
        `siona-illustrative-${slug}.glb`,
      );
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
      const glb = Buffer.concat(chunks);
      expect(glb.subarray(0, 4).toString()).toBe("glTF");
      expect(glb.readUInt32LE(4)).toBe(2);
      expect(glb.readUInt32LE(8)).toBe(glb.length);
      const json = JSON.parse(
        glb.subarray(20, 20 + glb.readUInt32LE(12)).toString(),
      );
      expect(json.meshes.length).toBeGreaterThan(0);
      expect(
        json.nodes.some(
          (node: { extras?: { educationalIllustration?: boolean } }) =>
            node.extras?.educationalIllustration,
        ),
      ).toBe(true);
    }
    await page
      .getByRole("button", { name: "Show all parts", exact: true })
      .click();
    await expect(
      page.getByRole("img", { name: /^Exploded three-component/ }),
    ).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "2D diagram", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Explore in 3D", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Reset view", exact: true }),
    ).toBeEnabled({ timeout: 20000 });
    await page
      .locator("canvas")
      .evaluate((canvas) =>
        canvas.dispatchEvent(
          new Event("webglcontextlost", { cancelable: true }),
        ),
      );
    await expect(
      page.getByText("3D is unavailable in this browser.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Three main parts of a knee replacement" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    expect(writes.filter((url) => !url.includes("__nextjs"))).toEqual([]);
  });

  test("unsupported WebGL retains the schematic and component explanations", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        ...args: Parameters<typeof original>
      ) {
        if (String(args[0]).startsWith("webgl")) return null;
        return original.apply(this, args);
      } as typeof original;
    });
    await page.goto(path);
    await page
      .getByRole("button", { name: "Explore in 3D", exact: true })
      .click();
    await expect(
      page.getByText("3D is unavailable in this browser.", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("group", { name: "Explore knee components" })
      .getByRole("button", { name: /Bearing insert/ })
      .click();
    await expect(
      page.getByRole("region", { name: "Selected component" }),
    ).toContainText("No exact bearing model");
  });
});

test("reduced motion turns the model one step without starting continuous spin", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page
    .getByRole("button", { name: "Explore in 3D", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reset view", exact: true }),
  ).toBeEnabled({ timeout: 20000 });
  const canvas = page.locator("canvas");
  const before = await canvas.screenshot();
  await canvas.click();
  await expect(
    page.getByRole("button", { name: "Spin model", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(async () => !(await canvas.screenshot()).equals(before))
    .toBe(true);
  const stopped = await canvas.screenshot();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect((await canvas.screenshot()).equals(stopped)).toBe(true);
});

test("Persona guide separates family options, evidence and unconfirmed configuration", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  await page.goto(path);
  const guide = page.getByRole("region", {
    name: "One family. Different choices.",
  });
  await expect(guide).toBeVisible();
  const sensor = page.getByRole("region", {
    name: "The chip is in the sensor stem.",
  });
  await expect(sensor).toContainText(
    "sensor-equipped stem beneath the tibial tray",
  );
  await expect(
    sensor.getByLabel("Manufacturer-described Persona IQ movement metrics"),
  ).toContainText("Cadence");
  await expect(sensor).toContainText("Home Base Station", { ignoreCase: true });
  await expect(sensor).toContainText("does not track GPS location");
  await sensor
    .getByText("Which stem version and labeling apply?", { exact: true })
    .click();
  await expect(sensor).toContainText("30 mm stem");
  await expect(sensor).toContainText("58 mm");
  await expect(sensor).toContainText("cleared April 24, 2024");
  await expect(
    sensor.getByRole("link", { name: /FDA K234056/ }),
  ).toHaveAttribute(
    "href",
    "https://www.accessdata.fda.gov/cdrh_docs/pdf23/K234056.pdf",
  );
  await expect(
    sensor.getByRole("link", { name: /Read the patient FAQs/ }),
  ).toHaveAttribute(
    "href",
    "https://www.zimmerbiomet.com/en/patients-caregivers/knee-replacement-implants-technologies/Persona-IQ-smart-knee.html",
  );
  const comparison = page.getByRole("region", {
    name: "Manufacturer record comparison",
  });
  const productCells = comparison
    .getByRole("row", { name: /Listed company/ })
    .locator("td");
  const lanes = await productCells.evaluateAll((cells) =>
    cells.map((cell) => ({
      color: getComputedStyle(cell).backgroundColor,
      gutter: parseFloat(getComputedStyle(cell).borderLeftWidth),
      width: cell.getBoundingClientRect().width,
    })),
  );
  expect(lanes[0].color).not.toBe(lanes[1].color);
  expect(lanes.every((lane) => lane.gutter >= 8)).toBe(true);
  const field = comparison
    .getByRole("row", { name: /Listed company/ })
    .getByRole("rowheader");
  await comparison.scrollIntoViewIfNeeded();
  if ((page.viewportSize()?.width ?? 1000) < 640) {
    expect(
      (await field.boundingBox())!.width + lanes[0].width,
    ).toBeLessThanOrEqual(
      (await comparison.evaluate((element) => element.clientWidth)) + 1,
    );
  }
  const beforeX = (await field.boundingBox())!.x;
  await comparison.evaluate((element) => {
    element.scrollLeft = 180;
    element.scrollTop = 160;
  });
  expect(Math.abs((await field.boundingBox())!.x - beforeX)).toBeLessThan(2);

  await guide.getByRole("link", { name: "Materials", exact: true }).click();
  await expect(page.locator("#persona-materials")).toBeFocused();
  const femur = guide.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Femoral options", exact: true }),
  });
  await femur
    .getByText("Applicability & remaining gap", { exact: true })
    .click();
  await expect(femur).toContainText("exact materials remain unverified");
  const iq = guide.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Persona IQ", exact: true }),
  });
  const disclosure = iq.getByText("Claim, evidence & limits", { exact: true });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(iq).toContainText(
    "not intended to support clinical decision-making",
  );
  await expect(iq).toContainText("not included in every Persona implant");
  await expect(iq.getByRole("link")).toHaveAttribute(
    "href",
    "https://www.accessdata.fda.gov/cdrh_docs/pdf20/DEN200064.pdf",
  );
  await expect(guide).toContainText("whether any are included", {
    ignoreCase: true,
  });
  await guide
    .getByText("Study scope, funding & limitations", { exact: true })
    .click();
  await expect(guide).toContainText("Zimmer Biomet funding");
  await guide
    .getByText("Historical safety notice: scope matters", { exact: true })
    .click();
  await expect(guide).toContainText("not an assessment of our femoral example");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("group", { name: "Choose manufacturer example" })
    .getByRole("button", { name: /Stryker/ })
    .click();
  await expect(guide).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Persona options", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Exact component identity" }),
  ).toContainText("5510-F-401");
  await page
    .getByRole("group", { name: "Choose manufacturer example" })
    .getByRole("button", { name: /Zimmer Biomet/ })
    .click();
  await expect(guide).toBeVisible();
  await expect(iq.locator("details")).not.toHaveAttribute("open", "");
  expect(writes.filter((url) => !url.includes("__nextjs"))).toEqual([]);
});

test("research library exposes scope and provenance without promoting component or assembly verification", async ({
  page,
}) => {
  await page.goto(path);
  const record = page.getByRole("region", { name: "Persona research record." });
  await expect(record).toContainText("Family overview");
  await expect(record).toContainText("Needs editorial review");
  await expect(record).toContainText("No verified assembly");
  await record
    .getByText("Family, component and configuration: what is established?", {
      exact: true,
    })
    .click();
  await expect(record).toContainText(
    "has not reached verified-component depth",
  );
  await record
    .getByText("Claims, evidence labels and source passages", { exact: true })
    .click();
  await expect(record).toContainText("MR Conditional");
  await expect(record).toContainText("not permission for an MRI scan");
  await expect(record).toContainText(
    "PDF page 5 / Purpose and Device Description",
  );
  await record
    .getByText("Source register and search limitations", { exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(record).toContainText("2026-11-13");
  await expect(record).toContainText(
    "Full text returned a browser challenge today",
  );
  await expect(record).toContainText('"42-5026-066-02" "package insert"');
  // Scan the expanded research panel; the existing suite covers the main guide/3D.
  expect(
    (
      await new AxeBuilder({ page })
        .include("#device-research")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("group", { name: "Choose manufacturer example" })
    .getByRole("button", { name: /Stryker/ })
    .click();
  await expect(record).toHaveCount(0);
  const stryker = page.getByRole("region", {
    name: "Triathlon research record.",
  });
  await expect(stryker).toContainText("Discovery candidate");
  await stryker
    .getByText("Claims, evidence labels and source passages", { exact: true })
    .click();
  await expect(stryker).toContainText("5510-F-401");
  await expect(stryker).not.toContainText("Ti-Nidium");
  await expect(stryker).not.toContainText("0.1 points");
  await expect(stryker).toContainText(
    "does not establish safety or lack of safety",
  );
});

test("exact-component checklist keeps unresolved MRI, compatibility and manufacturer sources scoped", async ({
  page,
}) => {
  await page.goto(path);
  const persona = page.getByRole("region", {
    name: "Persona research record.",
  });
  await expect(
    persona.getByRole("heading", {
      name: "Exact-component verification checklist",
    }),
  ).toBeVisible();
  await persona
    .getByText("MRI labeling and conditions · Unresolved", { exact: true })
    .click();
  await expect(
    persona.getByText(/Can the MRI team check the complete implant list/),
  ).toBeVisible();
  await expect(
    persona.getByText(/Non-U.S. patient leaflet and sensor-system MRI leads/),
  ).toBeVisible();
  await persona
    .getByText(
      "Tibial and bearing compatibility · Partial evidence — unresolved",
      { exact: true },
    )
    .click();
  await expect(
    persona
      .locator("details")
      .filter({
        has: page.locator("summary", {
          hasText: /^Tibial and bearing compatibility ·/,
        }),
      })
      .getByText(/Exact model-to-chart applicability/),
  ).toBeVisible();
  await persona
    .getByText(
      "Regulatory records and safety notices · Partial evidence — unresolved",
      { exact: true },
    )
    .click();
  await expect(persona.getByText(/Search results do not prove/)).toHaveCount(0);
  await expect(
    persona
      .locator("details")
      .filter({
        has: page.locator("summary", {
          hasText: /^Regulatory records and safety notices ·/,
        }),
      })
      .getByText(/FDA query retrieval failed/),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include("#device-research")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("group", { name: "Choose manufacturer example" })
    .getByRole("button", { name: /Stryker/ })
    .click();
  const triathlon = page.getByRole("region", {
    name: "Triathlon research record.",
  });
  await triathlon
    .getByText("Materials and surface treatments · Unresolved", { exact: true })
    .click();
  await expect(
    triathlon
      .locator("details")
      .filter({
        has: page.locator("summary", {
          hasText: /^Materials and surface treatments ·/,
        }),
      })
      .getByText(/5510-F-401 only/),
  ).toBeVisible();
  await triathlon
    .getByText("Source register and search limitations", { exact: true })
    .click();
  await expect(
    triathlon.getByRole("link", { name: /Stryker electronic labeling portal/ }),
  ).toHaveAttribute("href", "https://labeling.stryker.com/hcp");
  await expect(
    triathlon.getByRole("link", {
      name: /Zimmer Biomet electronic labeling portal/,
    }),
  ).toHaveCount(0);
  await expect(triathlon).not.toContainText("K172524");
  await expect(triathlon).toContainText("Discovery candidate");
});

test("consumer choices precede research detail and scope remains clear across manufacturers", async ({
  page,
}) => {
  await page.goto(path);
  const scope = page.getByRole("complementary", {
    name: "What this example establishes",
  });
  await expect(scope).toContainText("42-5026-066-02");
  await expect(scope).toContainText("No compatible assembly is verified");
  expect(
    await page.evaluate(
      () =>
        document
          .querySelector("#persona-options")!
          .compareDocumentPosition(
            document.querySelector("#device-research")!,
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBeTruthy();
  const guide = page.locator("#persona-options");
  expect(
    await guide.evaluate(
      (node) =>
        node
          .querySelector("#persona-configuration")!
          .compareDocumentPosition(node.querySelector("#persona-iq-feature")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBeTruthy();
  await guide.getByRole("link", { name: "Materials", exact: true }).click();
  await expect(page.locator("#persona-materials")).toBeFocused();
  await expect(page.locator("#persona-materials")).toContainText(
    "Neither establishes the alloy of femoral model",
  );
  const record = page.getByRole("region", { name: "Persona research record." });
  await record
    .getByText("Discovery and inclusion record", { exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(record).toContainText("Availability: unknown");
  await record
    .getByText("Materials and surface treatments · Unresolved", { exact: true })
    .click();
  const material = record
    .locator("details")
    .filter({
      has: page.locator("summary", {
        hasText: /^Materials and surface treatments ·/,
      }),
    });
  await expect(material).toContainText("Research gap: Source inaccessible");
  await expect(
    material.getByText(/Next feasible retrieval route/),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Device information sections" })
    .getByRole("link", { name: /Questions to ask/ })
    .click();
  await expect(page.locator("#device-questions")).toBeFocused();
  expect(await page.locator("#device-questions li").count()).toBe(6);
  await page
    .getByRole("group", { name: "Choose manufacturer example" })
    .getByRole("button", { name: /Stryker/ })
    .click();
  await expect(scope).toContainText("5510-F-401");
  await expect(scope).not.toContainText("42-5026-066-02");
  const stryker = page.getByRole("region", {
    name: "Triathlon research record.",
  });
  await stryker
    .getByText("Source register and search limitations", { exact: true })
    .click();
  await expect(stryker).not.toContainText('"42-5026-066-02"');
  await expect(stryker).not.toContainText("Persona trial");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
