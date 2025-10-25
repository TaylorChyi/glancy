import { buildShareDocument, __INTERNAL__ } from "./documentModel.js";
import { toTrimmedString } from "./documentFormatting.js";

const { buildFromMarkdown } = __INTERNAL__;

describe("documentModel", () => {
  test("buildShareDocument prioritises markdown source when provided", () => {
    /**
     * 测试目标：
     *  - 确认当 markdown 文本存在时，构建器只生成单一无标题区块且去除多余空白。
     * 前置条件：
     *  - 提供带有前后空格与空行的 markdown 字符串。
     * 步骤：
     *  1) 调用 buildShareDocument 构造文档模型。
     * 断言：
     *  - 标题为空，sections 仅包含一项且行内容已去除尾随空格。
     * 边界/异常：
     *  - 若返回含标题或包含空白行则测试失败。
     */
    const markdown = "  Heading\ncontent line  \n\n";
    const result = buildShareDocument({
      term: "term",
      entry: { markdown },
      finalText: "should be ignored",
      t: {},
    });
    expect(result.title).toBe("term");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].heading).toBe("");
    expect(result.sections[0].lines).toEqual(["Heading", "content line"]);
  });

  test("buildFromMarkdown trims trailing whitespace per line", () => {
    /**
     * 测试目标：
     *  - 确认 buildFromMarkdown 对每一行执行尾部空白裁剪并过滤空输入。
     * 前置条件：
     *  - 模拟包含多行与空格的 markdown 源。
     * 步骤：
     *  1) 调用 buildFromMarkdown。
     * 断言：
     *  - 返回数组去除空串并保留原始顺序。
     * 边界/异常：
     *  - 输入空字符串时不应抛出异常。
     */
    const lines = buildFromMarkdown("line 1  \nline 2\n\n");
    expect(lines).toEqual(["line 1", "line 2"]);
    expect(buildFromMarkdown(" ")).toEqual([]);
  });

  test("legacy entry extracts numbered definitions", () => {
    /**
     * 测试目标：
     *  - 验证 legacy 词条会生成编号释义并保持条目顺序。
     * 前置条件：
     *  - 传入包含音标、释义、例句的 legacy entry。
     * 步骤：
     *  1) 调用 buildShareDocument。
     * 断言：
     *  - sections 中含有音标、释义与例句，释义编号从 1 开始。
     * 边界/异常：
     *  - 若释义为空或编号错误则失败。
     */
    const result = buildShareDocument({
      term: "example",
      entry: {
        phonetic: "[ˈtest]",
        definitions: ["first", "second"],
        example: "usage",
      },
      t: {
        phoneticLabel: "Phonetic",
        definitionsLabel: "Definitions",
        exampleLabel: "Example",
      },
    });

    expect(result.sections).toEqual([
      { heading: "Phonetic", lines: ["[ˈtest]"] },
      { heading: "Definitions", lines: ["1. first", "2. second"] },
      { heading: "Example", lines: ["usage"] },
    ]);
  });

  test("toTrimmedString normalises non-string input", () => {
    /**
     * 测试目标：
     *  - 确保工具函数对非字符串值进行安全裁剪并转为字符串。
     * 前置条件：
     *  - 传入数字与 null。
     * 步骤：
     *  1) 分别调用 toTrimmedString。
     * 断言：
     *  - 数字被转换为去除空格的字符串，null 返回空串。
     * 边界/异常：
     *  - 若转换抛错或返回非字符串则失败。
     */
    expect(toTrimmedString(42)).toBe("42");
    expect(toTrimmedString(null)).toBe("");
  });
});
