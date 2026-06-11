import { defineConfig, devices } from "@playwright/test";

const localNoProxy = ["127.0.0.1", "localhost", process.env.NO_PROXY, process.env.no_proxy]
  .filter(Boolean)
  .join(",");
process.env.NO_PROXY = localNoProxy;
process.env.no_proxy = localNoProxy;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "api-integration",
      testMatch: /integration\/.*\.spec\.ts/,
      use: {
        baseURL: process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:4000"
      }
    },
    {
      name: "chromium",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL
      }
    }
  ],
  webServer: [
    {
      command: "node src/backend/dist/server.js",
      url: "http://127.0.0.1:4000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: "BACKEND_BASE_URL=http://127.0.0.1:4000 pnpm --dir src/frontend start",
      url: "http://127.0.0.1:3000/login",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
