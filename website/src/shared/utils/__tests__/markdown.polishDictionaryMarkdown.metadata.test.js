/**
 * 背景：
 *  - 词典协议的元数据标签持续扩容，原测试文件将所有标签相关用例堆叠在一起导致定位困难。
 * 目的：
 *  - 聚合所有元数据标签与字段链拆分的测试，确保协议演进时有清晰的回归入口。
 * 关键决策与取舍：
 *  - 保留真实示例文本以捕捉格式细节，而非抽象化到最小片段；
 *  - 通过集中维护标签相关测试，降低后续新增标签时的修改跨度。
 * 影响范围：
 *  - 调整测试文件结构，运行时代码不受影响；
 *  - Jest 路径自动识别新文件，无需额外配置。
 * 演进与TODO：
 *  - 若协议新增大量标签，可按标签族群进一步拆分套件以保持文件精简。
 */
import { polishDictionaryMarkdown } from "../markdown.js";

/**
 * 测试目标：验证串联的英译英标签会被拆行并恢复空格，提升词条可读性。
 * 前置条件：行内包含 `Examples:Example1:...`、`UsageInsight:...` 等紧贴字段。
 * 步骤：
 *  1) 构造含多个紧贴字段的字典 Markdown 文本；
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 每个字段单独换行且标签加粗；失败说明标签拆分逻辑失效。
 * 边界/异常：
 *  - 覆盖多字段连缀的核心场景。
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
 * 前置条件：构造含 PracticePrompts 与 Answer 的多行 Markdown。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 处理原始文本；
 *  2) 读取格式化结果。
 * 断言：
 *  - Practice Prompts 与 Answer 标签加粗并独立成行；失败说明新协议标签未同步。
 * 边界/异常：
 *  - 覆盖带数字与句点的标签命名。
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
 * 测试目标：验证抖宝协议新增标签会被识别为需换行的行内标签。
 * 前置条件：构造含 Recommended Audience、Set Expressions、Historical Resonance 的列表项。
 * 步骤：
 *  1) 执行 polishDictionaryMarkdown；
 * 断言：
 *  - 每个新增标签被加粗并继承列表缩进；失败说明前端词表未同步。
 * 边界/异常：
 *  - 覆盖多标签连缀的演进场景。
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
 *  1) 调用 polishDictionaryMarkdown 进行格式化；
 *  2) 读取结果。
 * 断言：
 *  - 两个标签分别占据独立行；失败说明链式标签拆分缺失。
 * 边界/异常：
 *  - 覆盖新旧标签混用的紧凑输入。
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
 *  1) 调用 polishDictionaryMarkdown；
 * 断言：
 *  - 每个标签独占一行且冒号后补空格；失败说明分隔符修复缺失。
 * 边界/异常：
 *  - 覆盖标签和值紧贴的极限输入。
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
 * 测试目标：验证带编号的新增义项标签与协议信息标签能正确拆分并格式化。
 * 前置条件：输入为紧凑的冒号串联结构，包含 Senses、Collocations、SetExpressions。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown；
 * 断言：
 *  - 输出按 “Sense {编号} · {类别}” 格式渲染，并与其他标签一起换行；失败说明动态标签正则未覆盖。
 * 边界/异常：
 *  - 覆盖编号义项与新增标签组合的协议场景。
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
 * 测试目标：验证当标签之间仅以空格分隔时，仍可恢复冒号与段落换行。
 * 前置条件：构造由 Senses、Examples、UsageInsight 等标签组成的多行文本，标签和值之间只保留单个空格。
 * 步骤：
 *  1) 组合缺失冒号的 Markdown 字符串；
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 每个标签补齐冒号并换行；失败说明空格分隔补救逻辑缺失。
 * 边界/异常：
 *  - 覆盖全量空格分隔的退化场景。
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
