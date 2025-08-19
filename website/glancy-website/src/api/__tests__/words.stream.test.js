import { streamWord } from "@/api/words.js";
import { API_PATHS } from "@/config/api.js";
import { jest } from "@jest/globals";

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
  global.fetch = jest.fn().mockResolvedValue({ body: stream });
  const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

  const chunks = [];
  for await (const chunk of streamWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    token: "t",
  })) {
    chunks.push(chunk);
  }

  expect(global.fetch).toHaveBeenCalledWith(
    `${API_PATHS.words}/stream?userId=u&term=hello&language=ENGLISH`,
    expect.objectContaining({
      headers: { "X-USER-TOKEN": "t" },
      signal: undefined,
    }),
  );
  expect(chunks).toEqual(["part1", "part2"]);
  expect(infoSpy).toHaveBeenCalledWith("streamWord chunk", "part1");
  expect(infoSpy).toHaveBeenCalledWith("streamWord chunk", "part2");

  infoSpy.mockRestore();
  global.fetch = originalFetch;
});
