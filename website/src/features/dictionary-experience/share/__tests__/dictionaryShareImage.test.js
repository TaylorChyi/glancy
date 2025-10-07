import { describe, expect, test, jest } from "@jest/globals";

jest.unstable_mockModule("@/assets/glancy-web.svg", () => ({
  default: "glancy.svg",
}));
jest.unstable_mockModule("@/assets/default-user-avatar.svg", () => ({
  default: "avatar.svg",
}));

const shareModule = await import("../dictionaryShareImage.js");
const { buildShareDocument, __INTERNAL__ } = shareModule;

const t = {
  phoneticLabel: "音标",
  definitionsLabel: "释义",
  exampleLabel: "例句",
  synonymsLabel: "同义词",
  antonymsLabel: "反义词",
  relatedLabel: "相关词",
  variantsLabel: "变形",
  phrasesLabel: "常见词组",
};

describe("dictionaryShareImage buildShareDocument", () => {
  /**
   * 测试目标：当提供 markdown 时应直接拆分行并保留标题。
   * 前置条件：词条对象包含 markdown 字符串。
   * 步骤：
   *  1) 调用 buildShareDocument；
   * 断言：
   *  - title 匹配 term；
   *  - 第一节包含拆分后的文本行。
   */
  test("GivenMarkdownEntry_WhenBuildingDocument_ThenKeepsMarkdownLines", () => {
    const entry = { markdown: "# Heading\nLine" };
    const result = buildShareDocument({
      term: "word",
      entry,
      finalText: "",
      t,
    });

    expect(result.title).toBe("word");
    expect(result.sections[0].lines).toEqual(["# Heading", "Line"]);
  });

  /**
   * 测试目标：旧格式词条应被转换为带编号的释义节。
   * 前置条件：传入含 phonetic/definitions/example 的 legacy 对象。
   * 步骤：
   *  1) 调用 buildShareDocument；
   * 断言：
   *  - 生成的 sections 数量符合预期；
   *  - 释义节首行带编号。
   */
  test("GivenLegacyEntry_WhenBuildingDocument_ThenProducesStructuredSections", () => {
    const entry = {
      phonetic: "[wɜːd]",
      definitions: ["**noun** meaning"],
      example: "Use it well",
    };

    const result = buildShareDocument({
      term: "word",
      entry,
      finalText: "",
      t,
    });

    expect(result.sections).toHaveLength(3);
    expect(result.sections[1].heading).toBe("释义");
    expect(result.sections[1].lines[0]).toBe("1. noun meaning");
  });

  /**
   * 测试目标：新格式 JSON 词条应拆解出释义、关系词与例句。
   * 前置条件：传入含“发音解释”“常见词组”的对象。
   * 步骤：
   *  1) 调用 buildShareDocument；
   * 断言：
   *  - 释义节包含顺序标签；
   *  - 同义词信息被串联；
   *  - 常见词组被转换为列表前缀。
   */
  test("GivenStructuredEntry_WhenBuildingDocument_ThenExpandsNestedFields", () => {
    const entry = {
      词条: "impeccable",
      发音: { 英音: "im-pek-uh-buhl", 美音: "ɪmˈpɛkəbəl" },
      发音解释: [
        {
          释义: [
            {
              定义: "perfect",
              类别: "adj",
              关系词: { 同义词: ["flawless"] },
              例句: [{ 源语言: "an impeccable suit", 翻译: "无可挑剔的西装" }],
            },
          ],
        },
      ],
      常见词组: [{ 词组: "an impeccable taste", 解释: "极佳品味" }],
    };

    const result = buildShareDocument({
      term: entry.词条,
      entry,
      finalText: "",
      t,
    });

    const definitionLines = result.sections.find(
      (section) => section.heading === "释义",
    ).lines;

    expect(definitionLines[0]).toContain("1.1 perfect · adj");
    expect(definitionLines).toContain("同义词: flawless");
    expect(result.sections.find((s) => s.heading === "常见词组").lines[0]).toBe(
      "• an impeccable taste — 极佳品味",
    );
  });
});

describe("dictionaryShareImage wrapLine", () => {
  /**
   * 测试目标：长 token 需按字符拆分，保证不会溢出画布宽度。
   * 前置条件：构造 width 极小的离屏画布。
   * 步骤：
   *  1) 调用 wrapLine；
   * 断言：
   *  - 返回数组中不存在超过上限的字符串。
   */
  test("GivenLongToken_WhenWrapping_ThenSplitsByCharacters", () => {
    const ctx = {
      font: "400 20px sans-serif",
      measureText: (value) => ({ width: value.length * 8 }),
    };
    const segments = __INTERNAL__.wrapLine(ctx, "supercalifragilistic", 40);

    expect(
      segments.every((segment) => ctx.measureText(segment).width <= 40),
    ).toBe(true);
  });
});
