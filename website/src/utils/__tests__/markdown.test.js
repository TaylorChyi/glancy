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
});
