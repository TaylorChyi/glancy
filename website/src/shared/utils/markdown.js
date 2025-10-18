/**
 * 背景：
 *  - 旧版 markdown.js 堆叠近两千行逻辑，修改时极易引入回归且违反结构化 lint 约束。
 * 目的：
 *  - 暴露整理后的入口函数，并将实现细节拆分到 `markdown/` 目录下的可组合策略模块。
 */
export { extractMarkdownPreview } from "./markdown/jsonPreview.js";
export { polishDictionaryMarkdown } from "./markdown/polishDictionaryMarkdown.js";
