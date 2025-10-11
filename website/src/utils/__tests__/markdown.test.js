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

  /**
   * 测试目标：无序列表标记紧贴正文时自动补足空格，同时保持水平分隔线格式不变。
   * 前置条件：输入包含以 `-`、`*`、`+` 开头的无序列表项以及 `---` 水平线。
   * 步骤：
   *  1) 调用 polishDictionaryMarkdown 处理构造的 Markdown 文本。
   *  2) 读取格式化后的输出。
   * 断言：
   *  - 无序列表项补齐单个空格；水平线 `---` 不发生变化。
   * 边界/异常：
   *  - 覆盖不同无序列表前缀，确保后续改动不会破坏通用处理。
   */
  test("ensures unordered list markers preserve spacing", () => {
    const input = ["-第一条", "*第二条", "+第三条", "---"].join("\n");
    const expected = ["- 第一条", "* 第二条", "+ 第三条", "---"].join("\n");
    expect(polishDictionaryMarkdown(input)).toBe(expected);
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

  /**
   * 测试目标：确保标题后的行内标签会被拆分到独立行，恢复 Markdown 渲染。
   * 前置条件：输入中标题与标签紧邻且标签命中词表。
   * 步骤：
   *  1) 调用 polishDictionaryMarkdown 处理带标签的标题行。
   *  2) 读取返回文本。
   * 断言：
   *  - 断言标题与标签之间存在换行分隔。
   * 边界/异常：
   *  - 验证逻辑仅影响可识别标签，不修改普通粗体标题。
   */
  test("separates inline metadata labels from heading lines", () => {
    const input = "## Frequency&**Proficiency-Frequency Band**: High";
    const output = polishDictionaryMarkdown(input);
    expect(output).toContain("## Frequency&\n**Proficiency-Frequency Band**: High");
  });

  /**
   * 测试目标：词典章节标题后紧跟英文释义时应强制换行。
   * 前置条件：输入包含 `## 释义 Adj. ...` 形式的行。
   * 步骤：执行 polishDictionaryMarkdown。
   * 断言：标题与释义正文位于不同的行。
   * 边界/异常：验证不会破坏标题文本本身。
   */
  test("breaks section heading followed by english gloss", () => {
    const input = "## 释义 Adj. immaculate";
    const output = polishDictionaryMarkdown(input);
    expect(output).toBe("## 释义\nAdj. immaculate");
  });

  /**
   * 测试目标：英文章节标题后若残留额外说明，应在标题后换行保留正文。
   * 前置条件：输入包含 `## Synonyms additional cues`。
   * 步骤：执行 polishDictionaryMarkdown。
   * 断言：额外说明被放入标题下一行。
   * 边界/异常：确保额外说明文本不被裁剪。
   */
  test("breaks section heading followed by additional english text", () => {
    const input = "## Synonyms additional cues";
    const output = polishDictionaryMarkdown(input);
    expect(output).toBe("## Synonyms\nadditional cues");
  });
});
