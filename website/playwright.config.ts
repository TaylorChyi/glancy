/**
 * 背景：
 *  - Playwright 配置集中至 config/test/playwright.config.ts，此处导出以兼容默认入口。
 */
export { default } from "./config/test/playwright.config.ts";
