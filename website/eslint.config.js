/**
 * 背景：
 *  - ESLint 配置集中至 config/quality，此处维持 re-export 供 CLI 默认解析。
 */
export { default } from "./config/quality/eslint.config.js";
