/**
 * 背景：
 *  - 构建配置已迁移至 config/build，根目录仅保留转发表以兼容脚手架默认查找路径。
 * 目的：
 *  - 通过 re-export 方式确保第三方工具无需调整即可加载新配置。
 * 关键决策与取舍：
 *  - 使用 ESM re-export，避免重复导出逻辑；
 *  - 保持文件存在，兼容 IDE/CLI 默认约定。
 */
export { default } from "./config/build/vite.config.js";
