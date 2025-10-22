/**
 * 背景：
 *  - 例句与译文标签需要独立词表，配合示例策略识别翻译段落。
 * 目的：
 *  - 暴露示例相关词表及括号对定义。
 */
export const EXAMPLE_LABEL_TOKENS = new Set([
  "example",
  "examples",
  "例句",
  "用法示例",
  "用例",
]);

export const TRANSLATION_LABEL_TOKENS = new Set([
  "translation",
  "translations",
  "翻译",
  "译文",
]);

export const TRANSLATION_WRAPPER_PAIRS = Object.freeze([
  ["(", ")"],
  ["（", "）"],
  ["[", "]"],
]);
