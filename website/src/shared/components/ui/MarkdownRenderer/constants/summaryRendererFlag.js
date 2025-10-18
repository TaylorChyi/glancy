/**
 * 背景：
 *  - 折叠摘要既可以由内置组件渲染，也允许调用方注入自定义实现。
 * 目的：
 *  - 提供统一的标记常量，让 CollapsibleSection 能识别由工厂创建的摘要渲染器。
 * 关键决策与取舍：
 *  - 采用 Symbol 避免与用户 props 冲突；
 *  - 常量独立存放，满足 react-refresh "only export components" 约束。
 * 影响范围：
 *  - 折叠摘要渲染器的识别逻辑。
 */
const SUMMARY_RENDERER_FLAG = Symbol("CollapsibleSummaryRenderer");

export default SUMMARY_RENDERER_FLAG;
