import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/site",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4189/workshop/", headless: true, trace: "retain-on-failure" },
  webServer: [{
    command: "node webpage/tools/serve.mjs --port 4189 --base /workshop/",
    url: "http://127.0.0.1:4189/workshop/",
    reuseExistingServer: false
  }, {
    command: "node webpage/tools/serve.mjs --port 4193 --base /",
    url: "http://127.0.0.1:4193/",
    reuseExistingServer: false
  }]
});
