import { buildDictionaryEntryMarkdown } from "../dictionaryEntryMarkdownBuilder.js";

/**
 * 测试目标：含 markdown 字段的词条需保持归一化输出。
 * 前置条件：词条对象携带 markdown 字符串。
 * 步骤：执行构建函数。
 * 断言：输出等于 normalizeDictionaryMarkdown 处理后的结果。
 * 边界/异常：覆盖最直接的 markdown 场景。
 */
test("GivenMarkdownField_WhenBuildInvoked_ShouldReturnNormalizedMarkdown", () => {
  const entry = { markdown: "# Title" };
  const markdown = buildDictionaryEntryMarkdown(entry);
  expect(markdown).toBe("# Title");
});

/**
 * 测试目标：英中结构化词条需被转化为章节化 Markdown。
 * 前置条件：构造包含词条、发音、释义、词组的结构化对象。
 * 步骤：调用构建函数并拆分结果。
 * 断言：
 *  - 标题行包含词条；
 *  - “释义”章节包含编号、同义词与例句翻译；
 *  - 词组章节输出项目符号。
 */
test("GivenChineseStructuredEntry_WhenBuildInvoked_ShouldProduceSectionedMarkdown", () => {
  const entry = {
    词条: "impeccable",
    发音: { 英音: "ɪmˈpekəbəl", 美音: "ɪmˈpɛkəbəl" },
    发音解释: [
      {
        释义: [
          {
            定义: "无可挑剔的；完美的",
            类别: "adj.",
            关系词: {
              同义词: ["perfect", "flawless"],
              反义词: ["imperfect"],
            },
            例句: [
              {
                源语言: "She has impeccable taste.",
                翻译: "她的品味无可挑剔。",
              },
            ],
          },
        ],
      },
    ],
    常见词组: [
      { 词组: "impeccable timing", 释义: "恰到好处的时机" },
      "impeccable manners",
    ],
  };

  const markdown = buildDictionaryEntryMarkdown(entry);
  const lines = markdown.split("\n");
  expect(lines[0]).toBe("# impeccable");
  expect(markdown).toContain("## 释义");
  expect(markdown).toContain("1. adj. · 无可挑剔的；完美的");
  expect(markdown).toContain("同义词：perfect、flawless");
  expect(markdown).toContain("例句：She has impeccable taste.");
  expect(markdown).toContain("译文：她的品味无可挑剔。");
  expect(markdown).toContain("## 常见词组");
  expect(markdown).toContain("- impeccable timing — 恰到好处的时机");
  expect(markdown).toContain("- impeccable manners");
});

/**
 * 测试目标：传统英文词条应输出基础章节信息。
 * 前置条件：词条包含 term/definitions/example。
 * 步骤：构建 Markdown。
 * 断言：
 *  - 标题与释义序号存在；
 *  - 例句以标签形式展示。
 */
test("GivenLegacyEntry_WhenBuildInvoked_ShouldRenderLegacyMarkdown", () => {
  const entry = {
    term: "serendipity",
    phonetic: "[ˌserənˈdɪpəti]",
    definitions: ["the occurrence of happy events by chance"],
    example: "Serendipity brought them together.",
  };

  const markdown = buildDictionaryEntryMarkdown(entry);
  expect(markdown).toContain("# serendipity");
  expect(markdown).toContain("## 释义");
  expect(markdown).toContain("1. the occurrence of happy events by chance");
  expect(markdown).toContain("例句：Serendipity brought them together.");
});
