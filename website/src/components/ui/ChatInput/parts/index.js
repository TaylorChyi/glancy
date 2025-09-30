/**
 * 背景：
 *  - ChatInput 子部件分散，直接相对路径引用增加维护成本。
 * 目的：
 *  - 汇总 ChatInput 的粒度组件，统一出口便于消费端与测试复用。
 * 关键决策与取舍：
 *  - 采用简单 barrel 文件，保留具名导出保证可分析性与摇树优化。
 * 影响范围：
 *  - ChatInput 内部组件的引用路径。
 * 演进与TODO：
 *  - 若子组件数量持续增加，可考虑引入自动化导出脚本。
 */
export { default as ActionButton } from "./ActionButton.jsx";
export { default as LanguageMenu } from "./LanguageMenu.jsx";
