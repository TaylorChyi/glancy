import { polishDictionaryMarkdown } from "../markdown.js";

/**
 * 测试目标：验证 `polishDictionaryMarkdown` 会强制将译文放到独立行，避免与英文例句同行展示。
 * 前置条件：输入为含有加粗“翻译”标签且与例句同在一行的 Markdown。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown；
 * 断言：
 *  - 译文被拆分为独立行并继承列表缩进；失败说明断行正则回退。
 * 边界/异常：
 *  - 覆盖中英混排且带缩进的典型场景。
 */
test("polishDictionaryMarkdown enforces translation line break", () => {
  const source =
    "- **例句 1**: The road goes through some very bendy sections in the mountains.  **翻译**: 这条路在山里有几段非常蜿蜒曲折。";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **例句 1**: The road goes through some very bendy sections in the mountains.\n  **翻译**: 这条路在山里有几段非常蜿蜒曲折。",
  );
});

/**
 * 测试目标：验证英译英 Markdown 中的行内标签（如 Example）也会断行，保证可读性。
 * 前置条件：例句行末尾紧接另一个加粗标签。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 对字符串进行格式化。
 * 断言：
 *  - 第二个标签会换行并继承缩进；失败说明英文标签识别缺失。
 * 边界/异常：
 *  - 覆盖英文标签组合场景，确保逻辑不限于中文标签。
 */
test("polishDictionaryMarkdown splits english inline labels", () => {
  const source = "- **Meaning**: to light  **Example**: She lights a candle";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Meaning**: to light\n  **Example**: She lights a candle",
  );
});

/**
 * 测试目标：验证英译英标签在只有单个空格分隔时也能断行，避免释义与例句连在一起。
 * 前置条件：例句行与下一个标签仅以单个空格连接。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 处理源文本。
 * 断言：
 *  - 第二个标签被拆分成独立行；失败说明单空格路径未覆盖。
 * 边界/异常：
 *  - 防止因压缩空格导致的排版回退。
 */
test("polishDictionaryMarkdown splits labels separated by single space", () => {
  const source = "- **Meaning**: to light **Example**: She lights a candle";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Meaning**: to light\n  **Example**: She lights a candle",
  );
});

/**
 * 测试目标：验证组合标签（如 Pronunciation-British 或 AudioNotes）在英译英场景中也会断行，保持缩进对齐。
 * 前置条件：例句行中包含带连字符的标签名称。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 后续标签换行且继承列表缩进；失败说明复合标签未被识别。
 * 边界/异常：
 *  - 覆盖多语言标签命名中的连字符场景。
 */
test("polishDictionaryMarkdown splits composite english inline labels", () => {
  const source =
    "- **Pronunciation-British**: /ˈhjuː.mən/  **AudioNotes**: authoritative archival";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Pronunciation-British**: /ˈhjuː.mən/\n  **AudioNotes**: authoritative archival",
  );
});

/**
 * 测试目标：验证标题误与列表连写时会自动换行，恢复模板结构。
 * 前置条件：标题与后续列表项之间缺少换行并被连字符粘连。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 标题与列表项拆分成独立行；失败说明标题识别逻辑失效。
 * 边界/异常：
 *  - 覆盖 Doubao 返回的标题-列表粘连场景。
 */
test("polishDictionaryMarkdown splits heading-attached list markers", () => {
  const source = "## 音标-英式: /ˈmenjuː/\n- 美式: /ˈmenjuː/";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("## 音标\n- 英式: /ˈmenjuː/\n- 美式: /ˈmenjuː/");
});

/**
 * 测试目标：验证包含连字符的正常标题不会被误判为列表。
 * 前置条件：输入为合法的连字符标题，如 `## T-shirt: history`。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 标题保持原样；失败说明正则匹配过宽。
 * 边界/异常：
 *  - 防止标题拆分误伤正常排版。
 */
test("polishDictionaryMarkdown keeps hyphenated headings intact", () => {
  const source = "## T-shirt: history";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("## T-shirt: history");
});

/**
 * 测试目标：章节标题后的正文需被移到独立行，避免折标题夹带释义内容。
 * 前置条件：输入含有紧随标题的正文，如 `## 释义 1. 内容`。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown；
 *  2) 将结果按行拆分。
 * 断言：
 *  - 第一行仅保留标题，第二行开始才是正文。
 * 边界/异常：
 *  - 覆盖中文标题粘连正文场景。
 */
test("polishDictionaryMarkdown isolates section headings from content", () => {
  const source = "## 释义 1. 主要解释";
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual(["## 释义", "1. 主要解释"]);
});

/**
 * 测试目标：验证拆分后的连字符不会残留在标签行尾，避免渲染出 `value-`。
 * 前置条件：原始 Markdown 中多个标签通过连字符连接。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 连字符被移除且缩进正确；失败说明连字符清理逻辑缺失。
 * 边界/异常：
 *  - 覆盖多标签连写并包含连字符的边界情况。
 */
test("polishDictionaryMarkdown removes dangling label separators", () => {
  const source =
    "- **Pronunciation-British**: /deɪt/ - **American**: /deɪt/ - **AudioNotes**: crisp";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "- **Pronunciation-British**: /deɪt/",
      "  **American**: /deɪt/",
      "  **AudioNotes**: crisp",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证翻译行会继承有序列表的缩进，使得“翻译”与“例句”保持列对齐。
 * 前置条件：输入为有序列表行并含翻译标签。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 翻译行前缀缩进与列表编号保持一致；失败说明缩进计算逻辑错误。
 * 边界/异常：
 *  - 覆盖数字列表的缩进传递场景。
 */
test("translation line keeps ordered list indentation", () => {
  const source = "1. **例句**: Sample text  **翻译**: 示例文本";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("1. **例句**: Sample text\n   **翻译**: 示例文本");
});

/**
 * 测试目标：验证翻译行会继承嵌套无序列表的缩进，避免视觉错位。
 * 前置条件：原始文本为缩进的无序列表行并包含翻译标签。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 译文行的缩进与嵌套层级匹配；失败说明缩进推导失效。
 * 边界/异常：
 *  - 覆盖嵌套列表的缩进继承场景。
 */
test("translation line keeps nested unordered list indentation", () => {
  const source = "  - **例句**: Nested sample  **翻译**: 嵌套示例";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("  - **例句**: Nested sample\n    **翻译**: 嵌套示例");
});

/**
 * 测试目标：验证例句后紧跟的标题不会被误并入分词标记，仍保持独立换行。
 * 前置条件：例句行之后紧接 Markdown 标题行。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 处理包含标题的文本。
 * 断言：
 *  - 标题保留在独立行；失败说明示例分词逻辑误伤标题。
 * 边界/异常：
 *  - 防止例句拆分逻辑吞并后续标题。
 */
test("polishDictionaryMarkdown preserves heading after example segmentation", () => {
  const source = ["- **例句**: Hello world", "# 英文释义"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(["- **例句**: Hello world", "# 英文释义"].join("\n"));
});

/**
 * 测试目标：确保 `#token#` 分词标记仍会并入例句正文，分词逻辑保持向后兼容。
 * 前置条件：例句行之后紧随分词标记行。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 结果中的例句行尾附带分词标记；失败说明分词合并被破坏。
 * 边界/异常：
 *  - 覆盖分词标记典型路径，防止回归。
 */
test("polishDictionaryMarkdown keeps hash segmentation markers", () => {
  const source = ["- **例句**: 今天天气好", "#token#"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("- **例句**: 今天天气好 #token#");
});

/**
 * 测试目标：被拆成两行的标题需回收到同一行，符合模板要求。
 * 前置条件：标题被换行符断开为两行。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown；
 *  2) 拆分输出并比对。
 * 断言：
 *  - 标题合并为单行且后续列表保持原状。
 * 边界/异常：
 *  - 覆盖 LLM 输出中标题换行异常场景。
 */
test("polishDictionaryMarkdown merges broken headings into single line", () => {
  const source = ["##", "词汇学信息", "- 语体：中性"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual(["## 词汇学信息", "- 语体：中性"]);
});

/**
 * 测试目标：标题修复逻辑不应误将列表项并入标题。
 * 前置条件：标题下方直接跟随列表项而非标题正文。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 标题与列表保持两行输出；失败说明修复逻辑过度匹配。
 * 边界/异常：
 *  - 防止只有列表的标题被错误合并。
 */
test("polishDictionaryMarkdown keeps heading isolated when next line is list", () => {
  const source = ["##", "- 语体：中性"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual(["##", "- 语体：中性"]);
});

/**
 * 测试目标：验证 Sense 标签链会被格式化为结构化行，并保持换行顺序。
 * 前置条件：输入为紧凑的义项、例句、用法说明字段串，标签之间通过冒号连缀。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 输出中的每个标签独占一行并带有规范化标题；失败说明标签拆分逻辑回退。
 * 边界/异常：
 *  - 覆盖 Sense/Example/Usage 多段组合的核心路径。
 */
test("polishDictionaryMarkdown formats sense label chains", () => {
  const source =
    "Senses:S1Verb:to move toward the speaker.Examples:Example1:She came home immediately.UsageInsight:Common in storytelling.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Senses**:",
      "**Sense 1 · Verb**: to move toward the speaker.",
      "**Examples**:",
      "**Example 1**: She came home immediately.",
      "**Usage Insight**: Common in storytelling.",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证缺失冒号的标签链会被回写冒号并触发既有换行逻辑。
 * 前置条件：标签与值之间仅以空格连接，部分标签保留冒号。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown；
 * 断言：
 *  - 输出恢复为冒号分隔并逐行换行；失败说明冒号修复逻辑未生效。
 * 边界/异常：
 *  - 覆盖部分冒号丢失的混合场景。
 */
test("polishDictionaryMarkdown restores missing label delimiters", () => {
  const source =
    "Senses s1Verb:to move toward the speaker.Examples Example1:She came home immediately.UsageInsight:Common in storytelling.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Senses**:",
      "**Sense 1 · Verb**: to move toward the speaker.",
      "**Examples**:",
      "**Example 1**: She came home immediately.",
      "**Usage Insight**: Common in storytelling.",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证基于 emoji 的义项标记不会被补写冒号逻辑误伤。
 * 前置条件：Markdown 文本中包含 `2️⃣` 片段。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 括号内文本保持原样；失败说明冒号修复误伤括号内容。
 * 边界/异常：
 *  - 防止语料绑定信息被拆分。
 */
test("polishDictionaryMarkdown preserves sense marker emoji", () => {
  const source = "- cooperatewith: 与……合作2️⃣";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(source);
});
