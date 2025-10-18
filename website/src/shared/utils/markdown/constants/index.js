/**
 * 背景：
 *  - Markdown 工具模块需复用多组常量，若逐个 import 会拉长调用方声明并增加维护负担。
 * 目的：
 *  - 暴露统一出口，调用方可按需解构，便于未来替换实现或拆分模块。
 * 关键决策与取舍：
 *  - 保留细分文件结构（patterns/tokens 等），同时提供聚合出口减少循环依赖风险。
 */
export * from "./patterns.js";
export * from "./sectionTokens.js";
export * from "./inlineTokens.js";
export * from "./translationTokens.js";
export * from "./punctuation.js";
export * from "./segmentation.js";
