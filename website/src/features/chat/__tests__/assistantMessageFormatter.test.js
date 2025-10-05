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
