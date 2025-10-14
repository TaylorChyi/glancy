import { describe, expect, test } from "@jest/globals";
import { stripMarkdownArtifacts } from "../dictionaryPlainTextSanitizer.js";

describe("stripMarkdownArtifacts", () => {
  /**
   * 测试目标：带零宽空格的英文句子应恢复为可见空格。
   * 前置条件：字符串包含 Markdown 强调与 \u200B 字符。
   * 步骤：
   *  1) 调用 stripMarkdownArtifacts 处理示例文本；
   * 断言：
   *  - 返回值保留英文单词间空格且去除 Markdown 标记。
   */
  test("GivenZeroWidthSpaces_WhenStripping_ThenRestoresVisibleWhitespace", () => {
    const source =
      "**Time**\u200Bis\u200Bthe continued\nprogress of existence.";
    const result = stripMarkdownArtifacts(source);

    expect(result).toBe("Time is the continued progress of existence.");
  });

  /**
   * 测试目标：链接语法转换后仅保留文案，不携带多余空白。
   * 前置条件：输入包含 Markdown 链接与多余空格。
   * 步骤：
   *  1) 调用 stripMarkdownArtifacts 处理字符串；
   * 断言：
   *  - 输出文本合并空白并裁剪首尾间距。
   */
  test("GivenMarkdownLink_WhenStripping_ThenFlattensWhitespace", () => {
    const source = "  Visit [Site](https://example.com)   now  ";
    const result = stripMarkdownArtifacts(source);

    expect(result).toBe("Visit Site now");
  });
});
