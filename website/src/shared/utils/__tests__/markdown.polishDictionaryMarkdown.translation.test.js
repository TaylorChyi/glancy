import { polishDictionaryMarkdown } from "../markdown.js";

/**
 * 测试目标：未加粗的“翻译”标签需被识别并换行，避免译文紧贴例句或拆成单字。
 * 前置条件：例句行末尾直接跟随纯文本“翻译:” 标签，且仅以单个空格分隔。
 * 步骤：
 *  1) 构造包含未加粗翻译标签的 Markdown；
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 译文换行并继承缩进；失败说明纯文本翻译标签未被识别。
 * 边界/异常：
 *  - 覆盖 Doubao 返回的最小间隔场景。
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
 *  1) 构造含英文 Translation 标签的 Markdown；
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 翻译标签独占一行并继承缩进；失败说明英文标签词表未同步。
 * 边界/异常：
 *  - 覆盖英译英场景的翻译标签。
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
 * 测试目标：例句结尾或译文包裹的括号需被移除，确保“翻译:” 行不再含括号。
 * 前置条件：构造含半角与全角括号的两段 Markdown 例句。
 * 步骤：
 *  1) 对每段 Markdown 执行 polishDictionaryMarkdown；
 *  2) 比对示例与译文行的输出。
 * 断言：
 *  - 例句行不再保留括号，译文行以标签开头；失败说明括号清理未生效。
 * 边界/异常：
 *  - 覆盖半角与全角标点的兼容性。
 */
test("polishDictionaryMarkdown strips translation wrappers", () => {
  const cases = [
    {
      source: "- **例句**: She smiled. (翻译: 她笑了。)",
      expected: ["- **例句**: She smiled.", "  **翻译**: 她笑了。"],
    },
    {
      source: "- **例句**: 他回答道。（翻译: 他作出了回答。）",
      expected: ["- **例句**: 他回答道。", "  **翻译**: 他作出了回答。"],
    },
  ];
  cases.forEach(({ source, expected }) => {
    const result = polishDictionaryMarkdown(source);
    expect(result.split("\n")).toEqual(expected);
  });
});

/**
 * 测试目标：译文若仅以括号附在例句末尾，应被拆分为标准译文行并补齐“翻译”标签。
 * 前置条件：例句原文为英文，括号内包含中文译文且无显式标签。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown；
 *  2) 拆分输出行。
 * 断言：
 *  - 第一行仅保留例句，第二行补齐加粗翻译标签；失败说明括号译文未被识别。
 * 边界/异常：
 *  - 覆盖 Doubao 使用括号呈现译文的特殊格式。
 */
test("polishDictionaryMarkdown promotes parenthetical translation into labeled line", () => {
  const source = "- **例句**: She smiled. (她笑了。)";
  const result = polishDictionaryMarkdown(source);
  expect(result.split("\n")).toEqual([
    "- **例句**: She smiled.",
    "  **翻译**: 她笑了。",
  ]);
});

/**
 * 测试目标：英文补充说明括号不应被误判为译文行，需保持原始结构。
 * 前置条件：括号内仅含英文说明且缺少中文特征。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown；
 *  2) 对比输入输出。
 * 断言：
 *  - 原文保持不变；失败说明括号识别误伤。
 * 边界/异常：
 *  - 防止英文 parenthetical 被错误拆分。
 */
test("polishDictionaryMarkdown keeps english parentheses untouched", () => {
  const source = "- **例句**: She read the book (a classic).";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(source);
});

/**
 * 测试目标：译文别名（如“译文”）与分词标注共存时，仍应保持译文换行且分词留在例句行。
 * 前置条件：例句内含 `#token#` 分词标记并紧跟“译文:” 标签。
 * 步骤：
 *  1) 构造包含分词与译文别名的 Markdown；
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 分词标记保留在例句行，译文标签换行；失败说明译文别名识别或分词合并异常。
 * 边界/异常：
 *  - 覆盖译文别名与附加标注并存的复杂输入。
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
