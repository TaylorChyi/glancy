import { jest } from "@jest/globals";

let sseEvents = [];
const parseSseMock = async function* () {
  for (const event of sseEvents) {
    yield event;
  }
};

parseSseMock.setEvents = (events) => {
  sseEvents = events;
};

jest.unstable_mockModule("@/utils", () => ({
  parseSse: parseSseMock,
}));

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: () => ({ chat: {} }),
}));

const { streamChatMessage } = await import("../chat.js");

/**
 * 测试目标：验证 streamChatMessage 能够展开嵌套 messages/segments 结构。
 * 前置条件：mock fetch 返回任意响应体，并通过 parseSseMock 注入包含嵌套结构的事件序列。
 * 步骤：
 *  1) 设定 SSE 事件包含 message.content 数组及嵌套 messages；
 *  2) 调用 streamChatMessage 消费生成器；
 *  3) 收集输出片段。
 * 断言：
 *  - 仅产出一个拼接后的字符串 "layered stream ready"；
 * 边界/异常：
 *  - 若未来协议调整导致无法展开，本测试会失败提示解析逻辑需更新。
 */
test("streamChatMessage flattens nested message payloads", async () => {
  parseSseMock.setEvents([
    {
      data: JSON.stringify({
        choices: [
          {
            delta: {
              message: {
                content: [
                  { segments: [{ text: "layer" }, { content: "ed" }] },
                  { messages: [{ content: " stream" }] },
                  " ready",
                ],
              },
            },
          },
        ],
      }),
    },
  ]);

  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ body: Symbol("body") });
  const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

  const chunks = [];
  for await (const chunk of streamChatMessage({
    model: "test",
    messages: [],
  })) {
    chunks.push(chunk);
  }

  expect(chunks).toEqual(["layered stream ready"]);

  infoSpy.mockRestore();
  global.fetch = originalFetch;
});

/**
 * 测试目标：验证 streamChatMessage 兼容 delta.content 为数组的旧协议输出。
 * 前置条件：parseSseMock 注入包含 content 数组与 [DONE] 标记的事件。
 * 步骤：
 *  1) 配置 SSE 事件使 delta.content 为 text 与 content 字段组合；
 *  2) 读取 streamChatMessage 产生的片段；
 *  3) 收集输出。
 * 断言：
 *  - 输出结果应为单个字符串 "hello world"；
 * 边界/异常：
 *  - 若解析失败，说明新增逻辑破坏了历史格式兼容性。
 */
test("streamChatMessage preserves flat content parsing", async () => {
  parseSseMock.setEvents([
    {
      data: JSON.stringify({
        choices: [
          {
            delta: {
              content: [{ text: "hello" }, { content: " " }, "world"],
            },
          },
        ],
      }),
    },
    { data: "[DONE]" },
  ]);

  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ body: Symbol("body") });
  const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

  const chunks = [];
  for await (const chunk of streamChatMessage({
    model: "test",
    messages: [],
  })) {
    chunks.push(chunk);
  }

  expect(chunks).toEqual(["hello world"]);

  infoSpy.mockRestore();
  global.fetch = originalFetch;
});
