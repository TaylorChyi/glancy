/**
 * 背景：
 *  - Playwright 测试原置于根目录，难以与其它测试资源统一规划。
 * 目的：
 *  - 将配置集中管理，并指向新的 tests/e2e 目录。
 * 关键决策与取舍：
 *  - 保留现有并行、重试策略，确保变更仅限目录结构调整。
 * 影响范围：
 *  - `npm run test:e2e` 命令的测试路径。
 * 演进与TODO：
 *  - 后续可依据环境变量注入不同浏览器矩阵。
 */
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
