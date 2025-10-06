import { createStreamingTextBuffer } from "../streamingTextBuffer.js";

/**
 * 测试目标：验证英文单词分片之间会自动补充空格。
 * 前置条件：首个分片与第二个分片均为英文单词且缺少前导空格。
 * 步骤：
 *  1) 调用 append 追加 "Hello"；
 *  2) 再追加 "World"；
 * 断言：
 *  - 聚合结果等于 "Hello World"；
 * 边界/异常：
 *  - 覆盖无空格单词场景，确保默认策略生效。
 */
test("inserts space between english word chunks", () => {
  const buffer = createStreamingTextBuffer();
  buffer.append("Hello");
  const result = buffer.append("World");
  expect(result).toBe("Hello World");
});

/**
 * 测试目标：验证回车符会被统一转换为换行符。
 * 前置条件：第二个分片包含 "\r\n"；
 * 步骤：
 *  1) 追加 "Line"；
 *  2) 追加 "\r\n"；
 *  3) 追加 "Next"；
 * 断言：
 *  - 聚合结果为 "Line\nNext"；
 * 边界/异常：
 *  - 覆盖 Windows 风格换行符，防止渲染异常。
 */
test("normalizes carriage returns into line feeds", () => {
  const buffer = createStreamingTextBuffer();
  buffer.append("Line");
  buffer.append("\r\n");
  const result = buffer.append("Next");
  expect(result).toBe("Line\nNext");
});

/**
 * 测试目标：验证中文字符不会被误插入空格。
 * 前置条件：连续追加两个中文字符串且均无前导空格；
 * 步骤：
 *  1) 追加 "你好"；
 *  2) 追加 "世界"；
 * 断言：
 *  - 聚合结果为 "你好世界"；
 * 边界/异常：
 *  - 避免对 CJK 场景添加多余空格。
 */
test("keeps cjk characters adjacent", () => {
  const buffer = createStreamingTextBuffer();
  buffer.append("你好");
  const result = buffer.append("世界");
  expect(result).toBe("你好世界");
});

/**
 * 测试目标：验证在标点符号后缺少空格时也会插入空格。
 * 前置条件：第一个分片以逗号结尾且第二个分片为英文单词；
 * 步骤：
 *  1) 追加 "Hi,"；
 *  2) 追加 "there"；
 * 断言：
 *  - 聚合结果为 "Hi, there"；
 * 边界/异常：
 *  - 避免标点后紧贴单词的显示问题。
 */
test("inserts spacing after punctuation when needed", () => {
  const buffer = createStreamingTextBuffer();
  buffer.append("Hi,");
  const result = buffer.append("there");
  expect(result).toBe("Hi, there");
});

/**
 * 测试目标：验证句号结尾的分片在下一个英文单词到来时同样会补空格。
 * 前置条件：首个分片以句号收尾，第二个分片以英文单词开头且缺少前导空格。
 * 步骤：
 *  1) 追加 "Done."；
 *  2) 追加 "Next"；
 * 断言：
 *  - 聚合结果为 "Done. Next"，若失败说明句号未被识别为需要补空格的标点。
 * 边界/异常：
 *  - 覆盖英语释义常见的句号断句场景，防止词典动态渲染出现单词粘连。
 */
test("inserts spacing after periods between english sentences", () => {
  const buffer = createStreamingTextBuffer();
  buffer.append("Done.");
  const result = buffer.append("Next");
  expect(result).toBe("Done. Next");
});
