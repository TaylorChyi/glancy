import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

import {
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
  useSettingsStore,
} from "@core/store/settings";
import {
  CHAT_CONVERSATION_STATUS,
  useChatConversation,
} from "@features/chat/hooks/useChatConversation.js";

beforeEach(() => {
  useSettingsStore.setState({
    chatCompletionMode: CHAT_COMPLETION_MODE_STREAMING,
  });
});

/**
 * 测试目标：验证流式模式下能够增量拼接助手消息。
 * 前置条件：Settings Store 为流式模式；提供自定义 streamFn。
 * 步骤：
 *  1) renderHook 渲染 useChatConversation；
 *  2) 发送用户消息；
 *  3) 等待异步逻辑完成。
 * 断言：
 *  - 第二条消息为助手角色且内容拼接成功；
 * 边界/异常：
 *  - 无。
 */
test("streams assistant reply incrementally", async () => {
  const streamFn = jest.fn().mockImplementation(async function* stream({
    messages,
  }) {
    expect(messages).toHaveLength(1);
    yield "Hello";
    yield " World";
  });
  const completeFn = jest.fn();
  const { result } = renderHook(() =>
    useChatConversation({ streamFn, completeFn }),
  );

  await act(async () => {
    await result.current.sendUserMessage("hi");
  });

  expect(streamFn).toHaveBeenCalledWith(
    expect.objectContaining({ responseMode: "stream" }),
  );
  expect(result.current.messages).toHaveLength(2);
  expect(result.current.messages[1]).toEqual({
    role: "assistant",
    content: "Hello World",
  });
  expect(result.current.status).toBe(CHAT_CONVERSATION_STATUS.idle);
});

/**
 * 测试目标：验证同步模式会调用 completeFn 并生成聚合回复。
 * 前置条件：Settings Store 设为同步模式；completeFn 返回格式化文本。
 * 步骤：
 *  1) 切换 Store；
 *  2) 渲染 Hook 并发送消息；
 *  3) 等待 Promise 完成。
 * 断言：
 *  - completeFn 入参包含 responseMode=sync；
 *  - 最后一条消息为助手回复。
 * 边界/异常：
 *  - 无。
 */
test("aggregates assistant reply when sync mode enabled", async () => {
  useSettingsStore.setState({ chatCompletionMode: CHAT_COMPLETION_MODE_SYNC });
  const streamFn = jest.fn();
  const completeFn = jest.fn().mockResolvedValue("**Bold** sync response");
  const { result } = renderHook(() =>
    useChatConversation({ streamFn, completeFn }),
  );

  await act(async () => {
    await result.current.sendUserMessage("hello");
  });

  expect(completeFn).toHaveBeenCalledWith(
    expect.objectContaining({ responseMode: "sync" }),
  );
  expect(result.current.messages.at(-1)).toEqual({
    role: "assistant",
    content: "**Bold** sync response",
  });
});

/**
 * 测试目标：验证流式模式出现异常时会标记错误状态。
 * 前置条件：Settings Store 为流式；streamFn 抛出错误。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 调用 sendUserMessage；
 *  3) 捕获内部错误处理。
 * 断言：
 *  - 状态为 error；
 *  - 仅保留用户消息。
 * 边界/异常：
 *  - streamFn 在首次迭代即抛错。
 */
test("marks error state when streaming fails", async () => {
  const error = new Error("boom");
  const streamFn = jest.fn().mockImplementation(async function* stream() {
    yield Promise.reject(error);
  });
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { result } = renderHook(() =>
    useChatConversation({ streamFn, completeFn: jest.fn() }),
  );

  await act(async () => {
    await result.current.sendUserMessage("oops");
  });

  expect(result.current.status).toBe(CHAT_CONVERSATION_STATUS.error);
  expect(result.current.messages).toEqual([{ role: "user", content: "oops" }]);
  expect(consoleSpy).toHaveBeenCalled();
  consoleSpy.mockRestore();
});
