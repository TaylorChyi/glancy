import { jest } from "@jest/globals";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream } from "stream/web";

const parseSseMock = async function* (stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
  }
  buffer = buffer.replace(/\r\n?/g, "\n");
  const events = buffer.split("\n\n");
  for (const raw of events) {
    if (!raw.trim()) continue;
    const event = { event: "message", data: "" };
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) {
        event.event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const value = line.slice(5).trimStart();
        event.data += event.data ? `\n${value}` : value;
      }
    }
    if (event.data) {
      yield event;
    }
  }
};

jest.unstable_mockModule("@/utils", () => ({
  createCachedFetcher: (impl) => impl,
  parseSse: parseSseMock,
}));

jest.unstable_mockModule("@/hooks", () => ({
  useApi: () => ({ words: {} }),
}));

const { streamWord } = await import("../words.js");
const { API_PATHS } = await import("../../config/api.js");
const { DEFAULT_MODEL } = await import("../../config/model.js");
const { WORD_FLAVOR_BILINGUAL } = await import("@/utils/language.js");

/**
 * 验证流式接口能够解析 SSE 并输出日志。
 */
test("streamWord yields chunks with logging", async () => {
  const encoder = new TextEncoder();
  const chunk1 = JSON.stringify({
    choices: [
      {
        delta: {
          content: "part1",
        },
      },
    ],
  });
  const chunk2 = JSON.stringify({
    choices: [
      {
        delta: {
          content: "part2",
        },
      },
    ],
  });
  const sse = `data: ${chunk1}\n\ndata: ${chunk2}\n\n`;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });

  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ body: stream, ok: true, status: 200 });
  const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

  const chunks = [];
  for await (const event of streamWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
    token: "t",
  })) {
    chunks.push(event);
  }

  expect(global.fetch).toHaveBeenCalledWith(
    `${API_PATHS.words}/stream?userId=u&term=hello&language=ENGLISH&flavor=${WORD_FLAVOR_BILINGUAL}&model=${DEFAULT_MODEL}&captureHistory=true`,
    expect.objectContaining({
      headers: expect.objectContaining({
        "X-USER-TOKEN": "t",
        Accept: "text/event-stream",
      }),
      signal: undefined,
      cache: "no-store",
    }),
  );
  expect(chunks).toEqual([
    { type: "chunk", data: "part1" },
    { type: "chunk", data: "part2" },
  ]);
  expect(infoSpy).toHaveBeenCalledWith("[streamWord] chunk", {
    userId: "u",
    term: "hello",
    chunk: "part1",
  });
  expect(infoSpy).toHaveBeenCalledWith("[streamWord] chunk", {
    userId: "u",
    term: "hello",
    chunk: "part2",
  });

  infoSpy.mockRestore();
  global.fetch = originalFetch;
});

/**
 * 验证包含完整 Doubao chunk 元信息时仍能抽取文本内容。
 */
test("streamWord strips doubao metadata wrapper", async () => {
  const encoder = new TextEncoder();
  const chunk = JSON.stringify({
    id: "0217601177769821",
    object: "chat.completion.chunk",
    created: 1760117777,
    model: "doubao-seed-1-6",
    service_tier: "default",
    choices: [
      {
        index: 0,
        delta: {
          content: "词条",
        },
      },
    ],
    usage: null,
  });
  const sse = `data: ${chunk}\n\n`;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });

  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ body: stream, ok: true, status: 200 });

  const outputs = [];
  for await (const event of streamWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  })) {
    outputs.push(event);
  }

  expect(outputs).toEqual([{ type: "chunk", data: "词条" }]);

  global.fetch = originalFetch;
});

/**
 * 测试目标：当 Doubao chunk 将 content 包裹为对象时，仍能抽出纯文本渲染。
 * 前置条件：stream 接口返回单个 data 事件，delta.content 是带 type/text 字段的对象。
 * 步骤：
 *  1) 构造仅含对象 content 的 SSE 响应；
 *  2) 调用 streamWord 消费响应；
 * 断言：
 *  - 返回的 chunk data 等于对象中的 text 字段；
 * 边界/异常：
 *  - 该场景覆盖 text 嵌套对象，是之前回退到原始 payload 的缺口。
 */
test("streamWord extracts text from object content payloads", async () => {
  const encoder = new TextEncoder();
  const chunk = JSON.stringify({
    choices: [
      {
        delta: {
          content: {
            type: "output_text",
            text: "object-wrapper",
          },
        },
      },
    ],
  });
  const sse = `data: ${chunk}\n\n`;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });

  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ body: stream, ok: true, status: 200 });

  const outputs = [];
  for await (const event of streamWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  })) {
    outputs.push(event);
  }

  expect(outputs).toEqual([{ type: "chunk", data: "object-wrapper" }]);

  global.fetch = originalFetch;
});

/**
 * 验证嵌套 message/content 结构能够被展开。
 */
test("streamWord flattens nested message structures", async () => {
  const encoder = new TextEncoder();
  const chunk = JSON.stringify({
    choices: [
      {
        delta: {
          message: {
            content: [
              {
                segments: [
                  { text: "layer" },
                  { content: "ed" },
                ],
              },
              { messages: [{ content: " stream" }] },
              " ready",
            ],
          },
        },
      },
    ],
  });
  const sse = `data: ${chunk}\n\n`;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });

  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ body: stream, ok: true, status: 200 });

  const chunks = [];
  for await (const event of streamWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  })) {
    chunks.push(event);
  }

  expect(chunks).toEqual([{ type: "chunk", data: "layered stream ready" }]);

  global.fetch = originalFetch;
});

/**
 * 验证收到 [DONE] 后停止产出 chunk。
 */
test("streamWord stops on DONE marker", async () => {
  const encoder = new TextEncoder();
  const done = String.fromCharCode(91) + "DONE" + String.fromCharCode(93);
  const chunk = JSON.stringify({
    choices: [
      {
        delta: {
          messages: [
            {
              content: [
                { text: "part" },
                { text: "1" },
              ],
            },
          ],
        },
      },
    ],
  });
  const sse = `data: ${chunk}\n\ndata: ${done}\n\n`;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });

  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ body: stream, ok: true, status: 200 });

  const chunks = [];
  for await (const chunk of streamWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  })) {
    chunks.push(chunk);
  }

  expect(chunks).toEqual([{ type: "chunk", data: "part1" }]);

  global.fetch = originalFetch;
});

/**
 * 验证收到 error 事件时抛出异常并记录日志。
 */
test("streamWord throws on error event", async () => {
  const encoder = new TextEncoder();
  const sse = "event: error\ndata: boom\n\n";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });

  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ body: stream, ok: true, status: 200 });
  const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

  await expect(
    (async () => {
      for await (const _chunk of streamWord({
        userId: "u",
        term: "hello",
        language: "ENGLISH",
        flavor: WORD_FLAVOR_BILINGUAL,
      })) {
        // consume stream
      }
    })(),
  ).rejects.toThrow("boom");

  expect(infoSpy).toHaveBeenCalledWith("[streamWord] error", {
    userId: "u",
    term: "hello",
    error: "boom",
  });

  infoSpy.mockRestore();
  global.fetch = originalFetch;
});
