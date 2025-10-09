import {
  extractMarkdownPreview,
  polishDictionaryMarkdown,
} from "./markdown.js";

/**
 * 验证纯 Markdown 文本会被原样返回（仅规范化换行）。
 */
test("returns plain markdown as-is", () => {
  const result = extractMarkdownPreview("# Title\r\nLine");
  expect(result).toBe("# Title\nLine");
});

/**
 * 验证完整 JSON 结构能正确提取 markdown 字段。
 */
test("extracts markdown from complete json", () => {
  const json = JSON.stringify({ term: "foo", markdown: "**bold**" });
  const result = extractMarkdownPreview(json);
  expect(result).toBe("**bold**");
});

/**
 * 验证流式 JSON 时能够解析部分 markdown 内容。
 */
test("parses partial markdown from json stream", () => {
  const chunk = '{"markdown":"# Tit';
  const result = extractMarkdownPreview(chunk);
  expect(result).toBe("# Tit");
});

/**
 * 验证 markdown 中的转义字符能够正确解码。
 */
test("decodes escaped characters", () => {
  const json = JSON.stringify({ markdown: 'Line 1\n\nHe said: "hi"' });
  const result = extractMarkdownPreview(json);
  expect(result).toBe('Line 1\n\nHe said: "hi"');
});

/**
 * 验证当 JSON 中尚未出现 markdown 字段时返回 null 以便沿用旧值。
 */
test("returns null when markdown key missing", () => {
  const json = '{"term":"foo"';
  const result = extractMarkdownPreview(json);
  expect(result).toBeNull();
});

/**
 * 验证 markdown 显式为 null 时返回空字符串。
 */
test("treats null markdown as empty string", () => {
  const json = '{"markdown":null}';
  const result = extractMarkdownPreview(json);
  expect(result).toBe("");
});

/**
 * 验证 `polishDictionaryMarkdown` 会强制将译文放到独立行，避免与英文例句同行展示。
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
 * 验证英译英 Markdown 中的行内标签（如 Example）也会断行，保证可读性。
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
 * 前置条件：使用 markdown 行内展示的例句与释义，且分隔符仅包含单个空格。
 * 步骤：
 *  1) 构造仅含单个空格的行内标签 markdown。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 例句标签会换行并继承列表缩进，若失败则表示正则未覆盖精简空格场景。
 * 边界/异常：
 *  - 此用例覆盖最紧凑的空格场景，可防止未来格式化逻辑回退。
 */
test("polishDictionaryMarkdown splits labels separated by single space", () => {
  const source = "- **Meaning**: to light **Example**: She lights a candle";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Meaning**: to light\n  **Example**: She lights a candle",
  );
});

/**
 * 验证组合标签（如 Pronunciation-British 或 AudioNotes）在英译英场景中也会断行，保持缩进对齐。
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
 * 前置条件：构造 Doubao 输出中常见的 `## 音标-英式: ...` 异常行。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 标题与首个列表项之间插入换行，避免渲染错位。
 * 边界/异常：
 *  - 该逻辑仅作用于已知模板标题，防止误伤包含连字符的常规标题。
 */
test("polishDictionaryMarkdown splits heading-attached list markers", () => {
  const source = "## 音标-英式: /ˈmenjuː/\n- 美式: /ˈmenjuː/";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("## 音标\n- 英式: /ˈmenjuː/\n- 美式: /ˈmenjuː/");
});

/**
 * 测试目标：验证包含连字符的正常标题不会被误判为列表。
 * 前置条件：构造 `## T-shirt: history` 这类合法标题。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown。
 * 断言：
 *  - 原始标题保持不变，确保分支条件足够保守。
 * 边界/异常：
 *  - 若误触发，说明白名单过宽，需要进一步收紧匹配条件。
 */
test("polishDictionaryMarkdown keeps hyphenated headings intact", () => {
  const source = "## T-shirt: history";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("## T-shirt: history");
});

/**
 * 测试目标：章节标题后的正文需被移到独立行，避免折叠标题夹带释义内容。
 * 前置条件：输入为 Doubao 风格的 `## 释义 1. ...` 行，正文紧跟标题。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 处理示例 Markdown。
 *  2) 读取结果并按行拆分。
 * 断言：
 *  - 第一行只保留标题 `## 释义`；
 *  - 第二行开始出现原始正文 `1. 主要解释`。
 * 边界/异常：
 *  - 覆盖中文标题配合编号场景，防止未来回归再次把正文塞入标题。
 */
test("polishDictionaryMarkdown isolates section headings from content", () => {
  const source = "## 释义 1. 主要解释";
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual(["## 释义", "1. 主要解释"]);
});

/**
 * 测试目标：验证拆分后的连字符不会残留在标签行尾，避免渲染出 `value-`。
 * 前置条件：原始 Markdown 以连字符连接多个行内标签，如 Pronunciation 与 American。
 * 步骤：
 *  1) 构造带有行尾连字符的 Markdown 字串。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 连字符被移除且下一行保留缩进；若失败则会看到行尾仍带 `-`。
 * 边界/异常：
 *  - 覆盖多级标签串联场景，防止未来回归导致 Markdown 渲染错位。
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
 * 验证翻译行会继承有序列表的缩进，使得“翻译”与“例句”保持列对齐。
 */
test("translation line keeps ordered list indentation", () => {
  const source = "1. **例句**: Sample text  **翻译**: 示例文本";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("1. **例句**: Sample text\n   **翻译**: 示例文本");
});

/**
 * 验证翻译行会继承嵌套无序列表的缩进，避免视觉错位。
 */
test("translation line keeps nested unordered list indentation", () => {
  const source = "  - **例句**: Nested sample  **翻译**: 嵌套示例";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("  - **例句**: Nested sample\n    **翻译**: 嵌套示例");
});

/**
 * 测试目标：未加粗的“翻译”标签需被识别并换行，避免译文紧贴例句或拆成单字。
 * 前置条件：例句行末尾直接跟随纯文本“翻译:” 标签，且仅以单个空格分隔。
 * 步骤：
 *  1) 构造包含未加粗翻译标签的 Markdown 字串。
 *  2) 执行 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 译文换行并继承列表缩进；若失败则说明翻译标签匹配缺失纯文本形态。
 * 边界/异常：
 *  - 覆盖 Doubao 返回的最小间隔场景，防止未来再次合并成单行。
 */
test("polishDictionaryMarkdown splits plain translation label", () => {
  const source =
    "- **例句**: She bought a bendy straw to drink her milkshake without a lid. 翻译: 她买了一根可弯吸管。";
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual([
    "- **例句**: She bought a bendy straw to drink her milkshake without a lid.",
    "  翻译: 她买了一根可弯吸管。",
  ]);
});

/**
 * 测试目标：英文 “Translation” 标签也需换行，确保多语种响应遵循相同排版规范。
 * 前置条件：例句与英文 Translation 标签之间仅由单个空格连接。
 * 步骤：
 *  1) 构造含英文 Translation 标签的 Markdown。
 *  2) 调用 polishDictionaryMarkdown 进行归一化。
 * 断言：
 *  - 翻译标签独占一行并继承列表缩进；失败说明词表未覆盖英文变体。
 * 边界/异常：
 *  - 覆盖英译英场景，防止未来仅识别中文标签。
 */
test("polishDictionaryMarkdown splits english translation label", () => {
  const source =
    "- **例句**: The suit looked impeccable at the gala. Translation: It was flawless in appearance.";
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual([
    "- **例句**: The suit looked impeccable at the gala.",
    "  **Translation**: It was flawless in appearance.",
  ]);
});

/**
 * 测试目标：译文别名（如“译文”）与分词标注共存时，仍应保持译文换行且分词留在例句行。
 * 前置条件：例句内含 `#token#` 分词标记并紧跟“译文:” 标签。
 * 步骤：
 *  1) 构造包含分词与译文别名的 Markdown。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 分词标记仍留在例句行；
 *  - “译文” 标签换行并继承缩进；
 *  - 失败则说明新逻辑破坏了分词合并或译文识别。
 * 边界/异常：
 *  - 覆盖译文别名与附件并存的极值场景，防止未来回归。
 */
test("polishDictionaryMarkdown splits translation alias while preserving markers", () => {
  const source =
    "- **例句**: 今天天气好 #token# 译文: The weather is great today.";
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual([
    "- **例句**: 今天天气好 #token#",
    "  译文: The weather is great today.",
  ]);
});

/**
 * 测试目标：验证例句后紧跟的标题不会被误并入分词标记，仍保持独立换行。
 * 前置条件：例句行之后立即出现 Markdown 标题行 `# 英文释义`。
 * 步骤：
 *  1) 构造包含例句与后续标题的 Markdown 字串。
 *  2) 调用 polishDictionaryMarkdown 进行格式化处理。
 * 断言：
 *  - 标题仍为独立行；若断言失败，说明示例分词逻辑错误吞并了标题。
 * 边界/异常：
 *  - 覆盖例句旁的标题场景，防止未来回归再次破坏 heading 结构。
 */
test(
  "polishDictionaryMarkdown preserves heading after example segmentation",
  () => {
    const source = ["- **例句**: Hello world", "# 英文释义"].join("\n");
    const result = polishDictionaryMarkdown(source);
    expect(result).toBe(["- **例句**: Hello world", "# 英文释义"].join("\n"));
  },
);

/**
 * 测试目标：确保 `#token#` 分词标记仍会并入例句正文，分词逻辑保持向后兼容。
 * 前置条件：例句行之后紧跟分词标记行 `#token#`。
 * 步骤：
 *  1) 构造包含例句与分词标记的 Markdown 字串。
 *  2) 调用 polishDictionaryMarkdown 获取格式化结果。
 * 断言：
 *  - 输出中的例句行末尾仍包含 `#token#`；若失败则表示新解析未保留分词标记。
 * 边界/异常：
 *  - 覆盖分词标记典型模式，防止正则调整造成回归。
 */
test("polishDictionaryMarkdown keeps hash segmentation markers", () => {
  const source = ["- **例句**: 今天天气好", "#token#"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("- **例句**: 今天天气好 #token#");
});

/**
 * 测试目标：被拆成两行的标题需回收到同一行，符合模板要求。
 * 前置条件：构造首行仅含井号、正文落在下一行的 Markdown。
 * 步骤：调用 polishDictionaryMarkdown 并按行拆分结果。
 * 断言：
 *  - 标题重新合并为单行；
 *  - 标题后续的内容保持原有结构。
 */
test("polishDictionaryMarkdown merges broken headings into single line", () => {
  const source = ["##", "词汇学信息", "- 语体：中性"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual(["## 词汇学信息", "- 语体：中性"]);
});

/**
 * 测试目标：标题修复逻辑不应误将列表项并入标题。
 * 前置条件：标题后立即跟随列表项，而非真实标题内容。
 * 步骤：执行 polishDictionaryMarkdown。
 * 断言：
 *  - 标题保持原状，列表项单独换行。
 */
test("polishDictionaryMarkdown keeps heading isolated when next line is list", () => {
  const source = ["##", "- 语体：中性"].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual(["##", "- 语体：中性"]);
});

/**
 * 测试目标：验证串联的英译英标签会被拆行并恢复空格，提升词条可读性。
 * 前置条件：行内包含 `Examples:Example1:...`、`UsageInsight:...` 等紧贴字段。
 * 步骤：
 *  1) 构造含多个紧贴字段的字典 Markdown 文本。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 每个字段单独换行，标签被加粗且冒号后带空格，若失败则表示新解析逻辑未生效。
 * 边界/异常：
 *  - 覆盖多字段连缀场景，可防止未来回归导致再次合并成单行。
 */
test("polishDictionaryMarkdown expands collapsed dictionary metadata", () => {
  const source = [
    "Examples:Example1:The train came at exactly 3:15 PM as scheduled.",
    "UsageInsight:Often used when describing precise arrivals.",
    "Register:Formal",
    "EntryType:SingleWord",
  ].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Examples**:",
      "**Example 1**: The train came at exactly 3:15 PM as scheduled.",
      "**Usage Insight**: Often used when describing precise arrivals.",
      "**Register**: Formal",
      "**Entry Type**: Single Word",
    ].join("\n"),
  );
});

/**
 * 测试目标：PracticePrompts 标签应被识别为行内标签并自动加粗换行。
 * 前置条件：构造含 PracticePrompts 与 Answer 的多行 Markdown 文本。
 * 步骤：
 *  1) 使用 polishDictionaryMarkdown 处理原始文本。
 *  2) 读取格式化结果。
 * 断言：
 *  - Practice Prompts 与 Answer 标签加粗，Sentence Correction 作为子标签换行展示。
 * 边界/异常：
 *  - 覆盖含数字与句点的标签，避免未来回退导致渲染失效。
 */
test("polishDictionaryMarkdown formats practice prompts metadata", () => {
  const source = [
    "PracticePrompts1.SentenceCorrection:",
    "Identify the error in the presentation.",
    "Answer: Replace 'her' with 'their'.",
  ].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Practice Prompts 1**:",
      "**Sentence Correction**:",
      "Identify the error in the presentation.",
      "**Answer**: Replace 'her' with 'their'.",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证抖宝协议新增标签（Recommended Audience、Set Expressions、Historical Resonance 等）会被识别为需换行的行内标签。
 * 前置条件：构造含多个新增标签的列表项，标签间仅以双空格分隔。
 * 步骤：
 *  1) 组合含新增标签的 Markdown 行。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 每个新增标签被加粗并继承列表缩进换行，若失败说明前端词表未与后端同步。
 * 边界/异常：
 *  - 覆盖多标签连缀场景，可防止后续协议升级导致排版回退为单行。
 */
test("polishDictionaryMarkdown splits newly synced protocol labels", () => {
  const source =
    "- **Meaning**: outline the idea  **Recommended Audience**: Intermediate learners  **Set Expressions**: take a stand  **Historical Resonance**: Rooted in 19th century rhetoric.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "- **Meaning**: outline the idea",
      "  **Recommended Audience**: Intermediate learners",
      "  **Set Expressions**: take a stand",
      "  **Historical Resonance**: Rooted in 19th century rhetoric.",
    ].join("\n"),
  );
});

/**
 * 测试目标：PracticePrompts 与 Answer 串联在同一行时需拆分换行，避免长行阻塞滚动。
 * 前置条件：构造同一行包含两个标签的 Markdown 文本。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 进行格式化。
 *  2) 读取格式化后的行间结构。
 * 断言：
 *  - Practice Prompts 与 Answer 分处独立行且继承列表缩进。
 * 边界/异常：
 *  - 防止未来正则遗漏带数字标签导致再次连成单行。
 */
test("polishDictionaryMarkdown splits inline practice prompts chains", () => {
  const source =
    "- PracticePrompts1.ContextualTranslation: Translate.  Answer: Provide context.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "- **Practice Prompts 1 Contextual Translation**: Translate.",
      "  **Answer**: Provide context.",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证当字段标签与上一个值直接拼接时仍能拆行、加粗并补足空格。
 * 前置条件：构造 `EntryType:SingleWordUsageInsight:...` 等缺失分隔符的字段串。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 进行格式化。
 *  2) 对比输出与预期结构化 Markdown。
 * 断言：
 *  - 每个标签独占一行，值保持原语义且冒号后有空格。
 * 边界/异常：
 *  - 覆盖无空白串联场景，防止未来回归导致再次输出为单行文本。
 */
test("polishDictionaryMarkdown separates labels merged into values", () => {
  const source =
    "EntryType:SingleWordUsageInsight:Often used in narratives.Register:FormalExtendedNotes:Retains period usage.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Entry Type**: Single Word",
      "**Usage Insight**: Often used in narratives.",
      "**Register**: Formal",
      "**Extended Notes**: Retains period usage.",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证带编号的新增义项标签（如 S1Definition）与协议信息标签（Collocations、SetExpressions）能正确拆分并格式化。
 * 前置条件：输入为紧凑的冒号串联结构，包含编号义项与新增标签。
 * 步骤：
 *  1) 构造 `Senses:S1Definition` 与协议信息标签的 Markdown 文本。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 输出中的编号标签以 “Sense {编号} · {类别}” 格式渲染，并与新增标签一并换行；失败则表示动态标签正则未覆盖。
 * 边界/异常：
 *  - 涵盖编号+新增标签组合，确保行内解析与后端 `resolveSection` 结果保持一致。
 */
test("polishDictionaryMarkdown formats numbered definition and protocol labels", () => {
  const source =
    "Senses:S1Definition:to restate core meaning.Collocations:make history.SetExpressions:set in stone.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Senses**:",
      "**Sense 1 · Definition**: to restate core meaning.",
      "**Collocations**: make history.",
      "**Set Expressions**: set in stone.",
    ].join("\n"),
  );
});

/**
 * 测试目标：验证当标签之间仅以空格分隔时，仍可恢复冒号与段落换行，确保层级结构清晰可读。
 * 前置条件：构造由 Senses、Examples、UsageInsight 等标签组成的行，标签和值之间只保留单个空格。
 * 步骤：
 *  1) 组合缺失冒号的词典 Markdown 字符串。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 每个标签会补齐冒号，并在遇到下一个标签时换行；释义与例句标签会恢复加粗与编号。
 * 边界/异常：
 *  - 覆盖全量空格分隔的场景，可防止未来回归导致再度输出为单行文本。
 */
test("polishDictionaryMarkdown restores space separated label chains", () => {
  const source = [
    "Senses s1Verb to move toward a place",
    "Examples Example1 The train came at exactly 3:15 PM as scheduled.",
    "UsageInsight Often used when describing precise arrivals.",
    "Register Formal",
    "EntryType SingleWord",
  ].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Senses**:",
      "**Sense 1 · Verb**: to move toward a place",
      "**Examples**:",
      "**Example 1**: The train came at exactly 3:15 PM as scheduled.",
      "**Usage Insight**: Often used when describing precise arrivals.",
      "**Register**: Formal",
      "**Entry Type**: Single Word",
    ].join("\n"),
  );
});

/**
 * 测试目标：确保冒号补空格逻辑不会破坏 URL 语法。
 * 前置条件：输入文本包含 `http://` 链接。
 * 步骤：
 *  1) 传入带 URL 的字符串。
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 输出与原始字符串一致，若失败说明误处理了协议前缀。
 * 边界/异常：
 *  - 涵盖最常见的协议格式，可避免未来修改误伤链接。
 */
test("polishDictionaryMarkdown preserves url colon usage", () => {
  const source = "See http://example.com for details";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(source);
});

/**
 * 测试目标：验证带编号义项标签（如 S1Verb）会被识别并换行，确保义项层级清晰。
 * 前置条件：输入为无换行的 Markdown 串，包含 `Senses:S1Verb`、`Example1` 等标签。
 * 步骤：
 *  1) 构造紧贴的义项、例句、用法说明字段字符串。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 输出中每个标签独占一行，义项标签被格式化为 “Sense {编号} · {词性}”。
 * 边界/异常：
 *  - 覆盖义项编号扩展场景，防止后续解析逻辑回退到单行输出。
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
 * 测试目标：验证缺失冒号的标签链（如 `Senses s1Verb`、`Examples Example1`）会被回写冒号，以触发既有换行逻辑。
 * 前置条件：输入为单行 Markdown，标签之间仅以空格连接且未显式包含冒号。
 * 步骤：
 *  1) 构造含 `Senses s1Verb`、`Examples Example1` 的紧凑文本。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 输出应等价于冒号原本存在时的格式，确保 `restoreMissingLabelDelimiters` 生效。
 * 边界/异常：
 *  - 覆盖行首标签缺失冒号的退化情形，防止未来回归导致再次输出单行。
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
 * 测试目标：验证英文标点后会自动补空格，避免释义文本紧贴导致阅读困难。
 * 前置条件：构造逗号与感叹号后缺少空格的 Markdown 行。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 处理原始字符串。
 *  2) 读取格式化后的释义行。
 * 断言：
 *  - 逗号与感叹号后补齐单个空格，若失败将仍旧粘连在一起。
 * 边界/异常：
 *  - 覆盖多种英文标点组合，防止未来修改回退到无空格状态。
 */
test("polishDictionaryMarkdown enforces spacing after english punctuation", () => {
  const source = "- **释义**: Follow me,please!Keep pace.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("- **释义**: Follow me, please! Keep pace.");
});

/**
 * 测试目标：例句正文中的分词标注需自动补空格，确保中英混排保持清晰断句。
 * 前置条件：例句行包含 [[专有名词]]、#词组#、{{补充信息}} 等分词符号以及英文标点。
 * 步骤：
 *  1) 使用 polishDictionaryMarkdown 处理例句行。
 *  2) 比对处理后的行是否在标记与正文之间插入空格。
 * 断言：
 *  - 分词标记与正文间存在单个空格，英文标点后补齐空格。
 * 边界/异常：
 *  - 覆盖多种分词标记组合，防止未来新增逻辑破坏现有排版。
 */
test("polishDictionaryMarkdown applies segmentation spacing to example content", () => {
  const source =
    "- **例句（中文）**: [[大熊猫]]栖息在#竹林#里,并且很可爱!还有{{保护区}}。";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **例句（中文）**: [[大熊猫]] 栖息在 #竹林# 里, 并且很可爱! 还有 {{保护区}}。",
  );
});
