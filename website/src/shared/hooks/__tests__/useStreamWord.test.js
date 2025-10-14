import { jest } from "@jest/globals";

const streamWordMock = jest.fn();
const apiMock = { words: { streamWord: streamWordMock } };

const sessionStreamMock = jest.fn();
const getStorePayloadMock = jest.fn();
const StreamWordSessionMock = jest.fn().mockImplementation(() => ({
  stream: sessionStreamMock,
  getStorePayload: getStorePayloadMock,
}));

jest.unstable_mockModule("../useApi.js", () => ({
  useApi: () => apiMock,
}));

jest.unstable_mockModule(
  "@features/dictionary-experience/streaming/streamWordSession.js",
  () => ({
    StreamWordSession: StreamWordSessionMock,
  }),
);

const { useStreamWord } = await import("../useStreamWord.js");
const { useWordStore } = await import("@core/store/wordStore.js");
const { useDataGovernanceStore } = await import(
  "@core/store/dataGovernanceStore.ts"
);
const { wordCacheKey } = await import("@shared/api/words.js");
const { DEFAULT_MODEL } = await import("@core/config");

beforeEach(() => {
  streamWordMock.mockReset();
  sessionStreamMock.mockReset();
  getStorePayloadMock.mockReset();
  StreamWordSessionMock.mockClear();
  useWordStore.getState().clear();
  useDataGovernanceStore.setState({ historyCaptureEnabled: true });
});

/**
 * 测试目标：验证 Hook 会实例化 StreamWordSession 并将结果写入 store。
 * 前置条件：session.stream 返回固定 chunk，getStorePayload 返回预设数据。
 * 步骤：
 *  1) 执行 Hook 并消费异步生成器。
 *  2) 读取 store 中的缓存记录。
 * 断言：
 *  - 会话构造参数包含语言、flavor、captureHistory 等字段。
 *  - store 接收到 getStorePayload 提供的 versions 与 metadata。
 * 边界/异常：覆盖主流程。
 */
test("GivenSessionWhenStreamingThenOrchestratesStoreWrite", async () => {
  sessionStreamMock.mockImplementation(async function* () {
    yield { chunk: "part", language: "ENGLISH" };
  });
  const expectedKey = wordCacheKey({
    term: "test",
    language: "ENGLISH",
    flavor: "BILINGUAL",
    model: DEFAULT_MODEL,
  });
  getStorePayloadMock.mockReturnValue({
    key: expectedKey,
    versions: [{ id: "1", markdown: "# title" }],
    options: { activeVersionId: "1", metadata: { flavor: "BILINGUAL" } },
  });

  const streamWordWithHandling = useStreamWord();
  const outputs = [];
  for await (const payload of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "test",
    signal: new AbortController().signal,
  })) {
    outputs.push(payload);
  }

  expect(outputs).toEqual([{ chunk: "part", language: "ENGLISH" }]);
  expect(StreamWordSessionMock).toHaveBeenCalledTimes(1);
  const sessionArgs = StreamWordSessionMock.mock.calls[0][0];
  expect(sessionArgs.request).toMatchObject({
    userId: "u",
    token: "t",
    term: "test",
    language: "ENGLISH",
    flavor: "BILINGUAL",
    captureHistory: true,
    model: DEFAULT_MODEL,
    key: expectedKey,
  });
  expect(sessionArgs.dependencies.streamWordApi).toBe(streamWordMock);
  expect(getStorePayloadMock).toHaveBeenCalledTimes(1);

  const cacheKey = Object.keys(useWordStore.getState().entries)[0];
  const record = useWordStore.getState().getRecord(cacheKey);
  expect(record.versions).toEqual([{ id: "1", markdown: "# title" }]);
  expect(record.metadata).toEqual({ flavor: "BILINGUAL" });
  expect(record.activeVersionId).toBe("1");
});

/**
 * 测试目标：验证禁用历史采集时会传递 captureHistory=false。
 * 前置条件：dataGovernance store 将 historyCaptureEnabled 设为 false。
 * 步骤：
 *  1) 调整治理偏好。
 *  2) 执行 Hook 并消费生成器。
 * 断言：
 *  - StreamWordSession 收到 captureHistory=false。
 * 边界/异常：覆盖偏好分支。
 */
test("GivenHistoryDisabled_WhenStreaming_ThenSessionReceivesCaptureFlag", async () => {
  useDataGovernanceStore.setState({ historyCaptureEnabled: false });
  sessionStreamMock.mockImplementation(async function* () {
    yield* [];
  });
  getStorePayloadMock.mockReturnValue({
    key: "cache",
    versions: [],
    options: { activeVersionId: undefined, metadata: {} },
  });

  const streamWordWithHandling = useStreamWord();
  for await (const _ of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "hello",
  })) {
    // consume
  }

  const sessionArgs = StreamWordSessionMock.mock.calls[0][0];
  expect(sessionArgs.request.captureHistory).toBe(false);
});

/**
 * 测试目标：验证当会话流抛出异常时 Hook 不会写入 store。
 * 前置条件：session.stream 迭代时抛错。
 * 步骤：
 *  1) 执行 Hook 并捕获异常。
 *  2) 检查 store 状态保持初始值。
 * 断言：
 *  - 异常透传至调用方。
 *  - getStorePayload 未被调用，store 仍为空。
 * 边界/异常：覆盖失败路径。
 */
test("GivenSessionFailure_WhenStreaming_ThenDoNotPersist", async () => {
  sessionStreamMock.mockImplementation(async function* () {
    yield* [];
    throw new Error("session failed");
  });

  const streamWordWithHandling = useStreamWord();
  await expect(
    (async () => {
      for await (const _ of streamWordWithHandling({
        user: { id: "u", token: "t" },
        term: "boom",
      })) {
        // no-op
      }
    })(),
  ).rejects.toThrow("session failed");

  expect(getStorePayloadMock).not.toHaveBeenCalled();
  expect(useWordStore.getState().entries).toEqual({});
});
