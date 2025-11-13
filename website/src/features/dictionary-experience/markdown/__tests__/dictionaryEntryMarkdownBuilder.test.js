import { buildDictionaryEntryMarkdown } from "../dictionaryEntryMarkdownBuilder.js";

const structuredEntryGolden = {
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
            相关词: ["accurate"],
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

const legacyEntryGolden = {
  term: "serendipity",
  phonetic: "[ˌserənˈdɪpəti]",
  definitions: ["the occurrence of happy events by chance"],
  example: "Serendipity brought them together.",
};

describe("buildDictionaryEntryMarkdown", () => {
  test("given markdown field, builder returns normalized string", () => {
    expect(
      buildDictionaryEntryMarkdown({ markdown: "# Title   " }),
    ).toBe("# Title");
  });

  test("renders structured chinese entry snapshot", () => {
    expect(buildDictionaryEntryMarkdown(structuredEntryGolden)).toMatchInlineSnapshot(`
"# impeccable

## 发音
- 英音：ɪmˈpekəbəl
- 美音：ɪmˈpɛkəbəl

## 释义
1. 1. adj. · 无可挑剔的；完美的
  - 同义词：perfect、flawless
  - 反义词：imperfect
  - 相关词：accurate
  - 例句：She has impeccable taste.
    译文：她的品味无可挑剔。

## 常见词组
- impeccable timing — 恰到好处的时机
- impeccable manners"
`);
  });

  test("renders legacy english entry snapshot", () => {
    expect(buildDictionaryEntryMarkdown(legacyEntryGolden)).toMatchInlineSnapshot(`
"# serendipity

## 发音
- 英音：[ˌserənˈdɪpəti]

## 释义
1. the occurrence of happy events by chance

- 例句：Serendipity brought them together."
`);
  });
});
