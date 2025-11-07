import path from "node:path";
import { defineConfig } from "@playwright/test";
import { PATHS } from "../shared/projectPaths.js";

export default defineConfig({
  testDir: path.join(PATHS.tests, "e2e"),
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
  },
});
