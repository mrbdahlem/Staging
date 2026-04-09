import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  use: {
    baseURL: "http://127.0.0.1:3000"
  },
  webServer: {
    command: "npm run build && npm run start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
