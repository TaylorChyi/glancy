/**
 * 背景：
 *  - Babel 配置原为 JSON，限制了注释与组合能力，也与其它配置分散在根目录。
 * 目的：
 *  - 统一管理 Babel 预设，使测试/构建工具引用时保持一致。
 * 关键决策与取舍：
 *  - 仅保留 React 自动 JSX 运行时，避免过度定制；
 *  - 转换为 JS 文件以支持后续根据环境扩展配置。
 * 影响范围：
 *  - babel-jest、潜在的 Babel CLI 执行。
 * 演进与TODO：
 *  - 后续如需按环境拆分，可在此导出工厂函数基于 process.env 选择预设。
 */
export default {
  presets: [["@babel/preset-react", { runtime: "automatic" }]],
};
