import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/passport-fixtures",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "off",
    screenshot: "off",
    video: "off",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node tests/passport-fixtures/server.mjs",
      url: "http://127.0.0.1:54331/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 3001",
      url: "http://127.0.0.1:3001/passport/login",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NEXT_PUBLIC_PASSPORT_SUPABASE_URL: "http://127.0.0.1:54331",
        NEXT_PUBLIC_PASSPORT_SUPABASE_PUBLISHABLE_KEY:
          "sb_publishable_fixture_only",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3001",
        PASSPORT_RUN_LIVE_TESTS: "0",
      },
    },
  ],
});
