/**
 * 背景：
 *  - 英文与中日韩字符在排版上对空格敏感，需基于受控集合判断是否需要补空格。
 * 目的：
 *  - 暴露 ASCII 标点与安全边界集合，供标点间距策略引用，降低魔法数字散落风险。
 * 关键决策与取舍：
 *  - 使用 `Set` 保障 O(1) 查询，并在注释中说明各字符的排版语义，方便未来扩展。
 * 影响范围：
 *  - ensureEnglishPunctuationSpacing 等策略的空格补写逻辑。
 */
export const ASCII_PUNCTUATION = new Set([",", ".", "!", "?", ";"]);

export const ASCII_PUNCTUATION_BOUNDARY = new Set([
  "\t",
  " ",
  "\n",
  "\r",
  ")",
  "]",
  "}",
  ">",
  "'",
  '"',
  "*",
  "_",
]);
