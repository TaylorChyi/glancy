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

jest.unstable_mockModule("@shared/utils", () => ({
  createCachedFetcher: (impl) => impl,
  parseSse: parseSseMock,
}));

jest.unstable_mockModule("@shared/hooks", () => ({
  useApi: () => ({ words: {} }),
}));

const { streamWord } = await import("../words.js");
const { API_PATHS } = await import("@core/config/api.js");
const { DEFAULT_MODEL } = await import("@core/config/model.js");
const { WORD_FLAVOR_BILINGUAL } = await import("@shared/utils/language.js");

/**
 * 验证流式接口能够解析 SSE 并输出日志。
 */
test("streamWord yields chunks with logging", async () => {
  const encoder = new TextEncoder();
  const sse = "data: part1\n\ndata: part2\n\n";
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

  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [requestedUrl, requestInit] = global.fetch.mock.calls[0];
  expect(requestedUrl).toContain(
    `${API_PATHS.words}/stream?userId=u&term=hello&language=ENGLISH&flavor=${WORD_FLAVOR_BILINGUAL}&model=${DEFAULT_MODEL}`,
  );
  expect(requestInit).toEqual(
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
 * 验证收到 [DONE] 后停止产出 chunk。
 */
test("streamWord stops on DONE marker", async () => {
  const encoder = new TextEncoder();
  const done = String.fromCharCode(91) + "DONE" + String.fromCharCode(93);
  const sse = "data: part1\n\ndata: " + done + "\n\ndata: part2\n\n";
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
