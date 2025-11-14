import { TextEncoder, TextDecoder } from "node:util";
import { ReadableStream } from "node:stream/web";
import { parseSse } from "./sse.js";

// Jest 环境下需要手动挂载 TextDecoder
global.TextDecoder = TextDecoder;

/**
 * 验证 parseSse 在一次性输入中能够解析多个事件
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
 * 验证 parseSse 在带有 CRLF 的分片数据流中逐事件产出
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
 * 测试目标：parseSse 应还原 data 行内嵌换行的片段。
 * 前置条件：SSE 文本中 data 仅首行带前缀，第二行直接以换行连接。
 * 步骤：
 *  1) 构造含换行的 SSE 事件并写入可读流。
 *  2) 运行 parseSse 消费全部事件。
 * 断言：
 *  - 解析出的 data 字段包含原始换行。
 * 边界/异常：
 *  - 若续行未正确拼接将导致数据缺失，断言失败信息会提示缺失内容。
 */
test("parseSse preserves embedded newlines without data prefix", async () => {
  const encoder = new TextEncoder();
  const sse = "data: Example:\n第二行释义\n\n";
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
  expect(events).toEqual([{ event: "message", data: "Example:\n第二行释义" }]);
});

/**
 * 断言：当 SSE 流以未闭合的事件结束时，parseSse 仍能输出该事件。
 */
test("parseSse flushes unterminated trailing event", async () => {
  const encoder = new TextEncoder();
  const sse = "data: dangling"; // 缺少结尾的空行分隔符
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
  expect(events).toEqual([{ event: "message", data: "dangling" }]);
});
