import { TextEncoder, TextDecoder } from "node:util";
import { ReadableStream } from "node:stream/web";
import { parseSse } from "./sse.js";

// Jest 环境下需要手动挂载 TextDecoder
global.TextDecoder = TextDecoder;

/**
 * 测试目标：验证 parseSse 在单次输入内正确解析多事件并保留顺序。
 * 前置条件：ReadableStream 仅推送一次包含 message/error/multi-line 的 SSE 字符串。
 * 步骤：
 *  1) 将编码后的整段 SSE 内容写入流并关闭；
 *  2) 迭代 parseSse 产出的事件；
 * 断言：
 *  - 事件数组按 message → error → message 顺序输出，且多行 data 被合并；
 * 边界/异常：
 *  - 覆盖单次写入场景，确保不会因未分片导致遗漏事件。
 */
test("parseSse yields events", async () => {
  const encoder = new TextEncoder();
  const sse =
    "data: one\n\n" +
    "event: error\ndata: boom\n\n" +
    "data: multi\ndata: line\n\n";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });
  const events = [];
  for await (const evt of parseSse(stream)) {
    events.push(evt);
  }
  expect(events).toEqual([
    { event: "message", data: "one" },
    { event: "error", data: "boom" },
    { event: "message", data: "multi\nline" },
  ]);
});

/**
 * 测试目标：验证 parseSse 在跨 chunk 的 CRLF 数据下仍可正确分帧。
 * 前置条件：SSE 内容被拆为多个分片，混合 \r\n、\r 结尾。
 * 步骤：
 *  1) 依次推送分片至 ReadableStream；
 *  2) 迭代 parseSse 输出；
 * 断言：
 *  - 返回两个 message 事件且数据分别为 one 与 two；
 * 边界/异常：
 *  - 覆盖 Windows/Mac 换行符混用场景。
 */
test("parseSse handles chunked CRLF events", async () => {
  const encoder = new TextEncoder();
  const chunks = ["data: one\r\n", "\r\n", "data: two\r", "\n\r\n"]; // 分片模拟跨 chunk 的 CRLF
  const stream = new ReadableStream({
    start(controller) {
      for (const part of chunks) {
        controller.enqueue(encoder.encode(part));
      }
      controller.close();
    },
  });
  const events = [];
  for await (const evt of parseSse(stream)) {
    events.push(evt);
  }
  expect(events).toEqual([
    { event: "message", data: "one" },
    { event: "message", data: "two" },
  ]);
});

/**
 * 测试目标：验证 data 字段仅剥离协议规定的单个空格，保留正文前导空格。
 * 前置条件：构造 data 行以单个空格开头的文本事件。
 * 步骤：
 *  1) 写入包含前导空格的 data 行并关闭流；
 *  2) 消费 parseSse 输出；
 * 断言：
 *  - data 内容以空格开头，确保未被 trimStart 误删；
 * 边界/异常：
 *  - 覆盖词粒度分片依赖前导空格的 Doubao 场景。
 */
test("parseSse preserves leading spaces in data payload", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data:  leading\n\n"));
      controller.close();
    },
  });
  const events = [];
  for await (const evt of parseSse(stream)) {
    events.push(evt);
  }
  expect(events).toEqual([{ event: "message", data: " leading" }]);
});
