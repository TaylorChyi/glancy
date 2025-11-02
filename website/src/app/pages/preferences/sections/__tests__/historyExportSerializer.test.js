import {
  DefinitionsByChapterCsvSerializer,
  definitionsByChapterCsvSerializer,
  __INTERNAL__,
} from "../historyExportSerializer.js";

const { toCsvRow, deriveChaptersFromEntry } = __INTERNAL__;

const buildStructuredEntry = () => ({
  sections: [
    { heading: "Basics", lines: ["alpha", "beta"] },
    { heading: "", content: "legacy" },
  ],
  markdown: "# Heading\nline 1\n\nline 2",
  phonetic: "[test]",
  definitions: ["def"],
  example: "example",
  发音: { 英音: "br", 美音: "us" },
  发音解释: [
    {
      释义: [
        {
          定义: "定义",
          类别: "类别",
          关系词: { 同义词: ["syn"], 反义词: ["ant"], 相关词: ["rel"] },
          例句: [{ 源语言: "src", 翻译: "dst" }],
        },
      ],
    },
  ],
  变形: [{ 状态: "past", 词形: "went" }],
  常见词组: [{ 词组: "phrase", 释义: "meaning" }],
});

const EXPECTED_HEADINGS = [
  "Basics",
  "General",
  "Heading",
  "Phonetic",
  "Definitions",
  "Example",
  "Phonetic",
  "Definitions",
  "Variants",
  "常见词组",
];

const expectChaptersFromEntry = (entry, translations = {}) => {
  const chapters = deriveChaptersFromEntry({ entry, translations });
  expect(chapters.map((chapter) => chapter.heading)).toEqual(EXPECTED_HEADINGS);
  expect(chapters[2].lines).toEqual(["line 1", "line 2"]);
};

const BASIC_HISTORY_ITEM = {
  term: "alpha",
  language: "en",
  flavor: "dict",
};

const DEFAULT_FALLBACK_CONTEXT = {
  translations: {
    settingsDataExportDefaultChapter: "General",
    settingsDataExportChapterColumn: "chapter",
    settingsDataExportContentColumn: "content",
  },
  resolveEntry: () => ({}),
};

const createChapterContext = () => ({
  translations: {
    settingsDataExportChapterColumn: "chapter",
    settingsDataExportContentColumn: "content",
    settingsDataExportDefaultChapter: "General",
  },
  resolveEntry: () => ({
    sections: [
      {
        heading: "Chapter",
        lines: ["first", "second"],
      },
    ],
  }),
});

describe("historyExportSerializer", () => {
  test("collects chapters from multiple sources", () => {
    /**
     * 测试目标：
     *  - 验证 deriveChaptersFromEntry 能合并 sections/markdown/结构化 collector。
     * 前置条件：
     *  - 构造带有 sections、markdown、结构化字段的 entry。
     * 步骤：
     *  1) 调用 deriveChaptersFromEntry；
     *  2) 对章节结果断言。
     * 断言：
     *  - 应包含来自每个来源的章节，并按既定顺序排列。
     * 边界/异常：
     *  - markdown 章节为空时应回退到 fallback。
     */
    expectChaptersFromEntry(buildStructuredEntry());
  });

  test("serializes CSV rows with fallback chapter", () => {
    /**
     * 测试目标：
     *  - 验证 DefinitionsByChapterCsvSerializer 在无章节时使用默认章节。
     * 前置条件：
     *  - 传入缺少可用章节的历史项。
     * 步骤：
     *  1) 使用 serialize 生成 CSV；
     *  2) 拆分行并断言内容。
     * 断言：
     *  - CSV 第一行为表头；
     *  - 数据行的章节列应为默认值且内容为空字符串。
     * 边界/异常：
     *  - 缺失 entry 时应保持 graceful degrade。
     */
    const serializer = new DefinitionsByChapterCsvSerializer();
    const csv = serializer.serialize(
      [BASIC_HISTORY_ITEM],
      DEFAULT_FALLBACK_CONTEXT,
    );

    const [header, row] = csv.split("\r\n");
    expect(header).toEqual(
      toCsvRow(["term", "language", "flavor", "chapter", "content"]),
    );
    expect(row).toEqual(toCsvRow(["alpha", "en", "dict", "General", ""]));
  });

  test("default serializer instance exports rows", () => {
    /**
     * 测试目标：
     *  - 验证默认实例可正常序列化带章节的历史项。
     * 前置条件：
     *  - 构造 resolveEntry 返回带章节的 entry。
     * 步骤：
     *  1) 调用 definitionsByChapterCsvSerializer.serialize；
     *  2) 解析 CSV 并断言章节内容。
     * 断言：
     *  - 数据行的章节标题与内容应与输入一致。
     * 边界/异常：
     *  - 确认多章节情况下输出多行。
     */
    const csv = definitionsByChapterCsvSerializer.serialize(
      [
        {
          term: "beta",
          language: "zh",
          flavor: "dict",
        },
      ],
      createChapterContext(),
    );

    const [, row] = csv.split("\r\n");
    expect(row).toEqual(
      toCsvRow(["beta", "zh", "dict", "Chapter", "first\nsecond"]),
    );
  });
});
