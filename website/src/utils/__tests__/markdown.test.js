import { polishDictionaryMarkdown } from "../markdown.js";

describe("polishDictionaryMarkdown", () => {
  test("inserts missing spaces after heading markers", () => {
    const input = "#标题\n##子标题";
    expect(polishDictionaryMarkdown(input)).toContain("# 标题");
    expect(polishDictionaryMarkdown(input)).toContain("## 子标题");
  });

  test("adds padding before adjacent headings", () => {
    const input = "段落\n## 标题";
    expect(polishDictionaryMarkdown(input)).toBe("段落\n\n## 标题");
  });

  test("ensures ordered list markers preserve spacing", () => {
    const input = "1.第一条\n2)第二条";
    expect(polishDictionaryMarkdown(input)).toBe("1. 第一条\n2) 第二条");
  });

  test("pulls inline headings onto dedicated lines", () => {
    const input = "词条: word##释义";
    expect(polishDictionaryMarkdown(input)).toBe("词条: word\n\n## 释义");
  });

  test("supports single hash headings when contextual cues exist", () => {
    const input = "词条: word#音标";
    expect(polishDictionaryMarkdown(input)).toBe("词条: word\n\n# 音标");
  });

  test("keeps inline hash tokens intact when no heading cues", () => {
    const input = "我们正在学习C#语言";
    expect(polishDictionaryMarkdown(input)).toBe(input);
  });
});
