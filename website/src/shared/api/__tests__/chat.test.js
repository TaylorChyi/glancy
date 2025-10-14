import { createChatApi } from "@shared/api/chat.js";
import { API_PATHS } from "@core/config/api.js";
import { jest } from "@jest/globals";

jest.mock("@shared/utils", () => ({
  parseSse: jest.fn(async function* parseSse() {
    // 空生成器即可满足流式测试对调用参数的断言。
  }),
}));

test("sendChatMessage posts to chat endpoint", async () => {
  const request = jest.fn().mockResolvedValue("ok");
  const api = createChatApi(request);
  await api.sendChatMessage("hi");
  expect(request).toHaveBeenCalledWith(
    API_PATHS.chat,
    expect.objectContaining({
      method: "POST",
    }),
  );
});

test("completeChatMessage requests aggregated response", async () => {
  const request = jest.fn().mockResolvedValue({ content: "done" });
  const api = createChatApi(request);
  const result = await api.completeChatMessage({
    model: "stub",
    messages: [{ role: "user", content: "hi" }],
    temperature: 0.7,
  });
  expect(request).toHaveBeenCalledWith(
    API_PATHS.chat,
    expect.objectContaining({
      headers: expect.objectContaining({ Accept: "application/json" }),
      body: JSON.stringify(expect.objectContaining({ responseMode: "sync" })),
    }),
  );
  expect(result).toBe("done");
});

test("streamChatMessage annotates response mode", async () => {
  const request = jest.fn();
  const api = createChatApi(request);
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    body: { [Symbol.asyncIterator]: async function* asyncGenerator() {} },
  });
  try {
    const iterator = api.streamChatMessage({
      model: "stub",
      messages: [{ role: "user", content: "hi" }],
    });
    await iterator.next();
    expect(global.fetch).toHaveBeenCalledWith(
      API_PATHS.chat,
      expect.objectContaining({
        body: JSON.stringify(
          expect.objectContaining({ responseMode: "stream" }),
        ),
      }),
    );
  } finally {
    global.fetch = originalFetch;
  }
});
