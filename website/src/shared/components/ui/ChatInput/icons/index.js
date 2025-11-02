/**
 * 背景：
 *  - ChatInput 的图标逐渐增多，单点引用难以维护。
 * 目的：
 *  - 提供集中出口，统一管理 ChatInput 内部的图标组件。
 * 关键决策与取舍：
 *  - 采用命名导出保持可树摇；暂不引入 barrel 自动化工具以避免构建复杂度。
 * 影响范围：
 *  - ChatInput 目录下引用图标的子组件。
 * 演进与TODO：
 *  - 后续若新增多图标，可考虑生成脚本自动维护出口。
 */
export { default as SendIcon } from "./SendIcon.jsx";
export { default as TriadIcon } from "./TriadIcon.jsx";
