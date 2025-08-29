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
