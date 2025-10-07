import { createAssistantMessageFormatter } from "../createAssistantMessageFormatter.js";
import { polishDictionaryMarkdown } from "@/utils/markdown.js";

/**
 * 测试目标：确认格式化器能够在普通对话文本中保持透传行为。
 * 前置条件：使用默认策略集合，输入不含词典信号的片段。
 * 步骤：
 *  1) 依次追加两段普通文本；
 *  2) 调用 reset 后再次追加。
 * 断言：
 *  - 输出等于原始拼接文本，不引入额外空白或格式化。
 * 边界/异常：
 *  - 验证 reset 后缓冲被清空，避免跨消息串扰。
 */
test("passthrough formatting for generic chat text", () => {
  const formatter = createAssistantMessageFormatter();
  const first = formatter.append("Hello");
  expect(first).toBe("Hello");
  const second = formatter.append(" world");
  expect(second).toBe("Hello world");
  formatter.reset();
  const afterReset = formatter.append("**bold**");
  expect(afterReset).toBe("**bold**");
});

/**
 * 测试目标：验证分词级流式输出会在缺少前导空格时自动补齐。
 * 前置条件：连续两次 append 的输入分别为 "Quick" 与 "Brown"，第二段不含空格。
 * 步骤：
 *  1) 调用 append("Quick")；
 *  2) 调用 append("Brown")；
 * 断言：
 *  - 第二次 append 返回值包含单个空格分隔两个单词；
 * 边界/异常：
 *  - 保证英文单词不会粘连，兼容词粒度分片。
 */
test("inserts spacing for word-level streaming chunks", () => {
  const formatter = createAssistantMessageFormatter();
  formatter.append("Quick");
  const second = formatter.append("Brown");
  expect(second).toBe("Quick Brown");
});

/**
 * 测试目标：验证回车符分片会被规范化为换行符后继续格式化。
 * 前置条件：第二个 append 输入为 "\r"，第三个 append 输入为 "Line"。
 * 步骤：
 *  1) 依次调用 append("Alpha"), append("\r"), append("Line");
 * 断言：
 *  - 最终返回值为 "Alpha\nLine"；
 * 边界/异常：
 *  - 覆盖 Windows 回车分片，防止出现残余回车字符。
 */
test("normalizes carriage return segments during streaming", () => {
  const formatter = createAssistantMessageFormatter();
  formatter.append("Alpha");
  formatter.append("\r");
  const result = formatter.append("Line");
  expect(result).toBe("Alpha\nLine");
});

/**
 * 测试目标：确认检测到抖宝词典信号后会回溯格式化已有文本。
 * 前置条件：默认策略集合，输入包含 Example/UsageInsight 等特征字段。
 * 步骤：
 *  1) 先追加标题片段，尚不足以触发策略；
 *  2) 再追加包含 Example1 与 UsageInsight 的正文；
 *  3) 计算 polishDictionaryMarkdown 的期望输出。
 * 断言：
 *  - 第二次 append 的返回值等于 polishDictionaryMarkdown(raw)。
 * 边界/异常：
 *  - 验证策略在识别信号前不会提前转换，确保流式过程平滑。
 */
test("formats doubao dictionary chunks incrementally", () => {
  const formatter = createAssistantMessageFormatter();
  const part1 = "## Come\n\n";
  const part2 = "Senses\nExample1:Shecameatexactly3:15PMasscheduled.\nUsageInsight:Travel context";
  const raw = part1 + part2;
  const interim = formatter.append(part1);
  expect(interim).toBe(part1);
  const final = formatter.append(part2);
  const expected = polishDictionaryMarkdown(raw);
  expect(final).toBe(expected);
});

/**
 * 测试目标：验证新增抖宝词典字段（英文释义、适用人群、搭配、派生、练习）也能触发格式化。
 * 前置条件：输入模拟新版 Doubao 词条，分成两段以覆盖“需累计多个信号后触发”的路径。
 * 步骤：
 *  1) 追加包含标题与 EnglishDefinitions 的首段；
 *  2) 追加含 RecommendedAudience/Collocations/Derivatives/PracticePrompts 的尾段；
 * 断言：
 *  - 第二次 append 返回 polishDictionaryMarkdown(raw)；
 * 边界/异常：
 *  - 验证大小写不敏感匹配（practiceprompts 为小写），确保未来字段扩展时可复用模式。
 */
test("formats doubao dictionary entries with extended field set", () => {
  const formatter = createAssistantMessageFormatter();
  const part1 = "## Illuminate\n\nEnglishDefinitions: 1. To provide light.";
  const part2 = [
    "\nrecommendedAudience: Intermediate learners",
    "\nCollocations: illuminate the path; illuminate a problem",
    "\nDerivatives: illumination; illuminative",
    "\npracticeprompts: Describe how you would illuminate a stage.",
  ].join("");
  const raw = part1 + part2;
  const interim = formatter.append(part1);
  expect(interim).toBe(part1);
  const final = formatter.append(part2);
  const expected = polishDictionaryMarkdown(raw);
  expect(final).toBe(expected);
});

/**
 * 测试目标：确认单一关键词不足以触发字典策略，维持普通文本透传。
 * 前置条件：仅包含一个疑似字段名（Collocations:）的输入；
 * 步骤：
 *  1) append 含 Collocations: 的文本；
 * 断言：
 *  - 返回值等于原文，说明阈值保护生效；
 * 边界/异常：
 *  - 避免普通对话偶然包含字段名时被误判为词典模式。
 */
test("does not switch to dictionary formatting for single signal", () => {
  const formatter = createAssistantMessageFormatter();
  const raw = "Collocations: are useful study aids in many contexts.";
  const result = formatter.append(raw);
  expect(result).toBe(raw);
});
