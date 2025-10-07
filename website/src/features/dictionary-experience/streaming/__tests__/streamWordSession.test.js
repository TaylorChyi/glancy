import { jest } from "@jest/globals";
import { StreamWordSession } from "../streamWordSession.js";

const streamWordApi = jest.fn();
const logger = { info: jest.fn() };
const normalize = (value) => value;

const baseRequest = {
  userId: "user-1",
  token: "token-1",
  term: "test",
  language: "ENGLISH",
  flavor: "BILINGUAL",
  signal: undefined,
  forceNew: false,
  versionId: undefined,
  captureHistory: true,
  model: "gpt",
  key: "cache-key",
};

const createSession = (overrides = {}) =>
  new StreamWordSession({
    request: { ...baseRequest, ...(overrides.request ?? {}) },
    dependencies: {
      streamWordApi,
      normalize,
      logger,
      ...(overrides.dependencies ?? {}),
    },
  });

afterEach(() => {
  streamWordApi.mockReset();
  logger.info.mockReset();
});

/**
 * 测试目标：验证纯 JSON 词条可被解析并返回结构化版本列表。
 * 前置条件：流式接口仅返回 JSON chunk。
 * 步骤：
 *  1) 启动 session.stream 并消费全部 chunk。
 *  2) 调用 getStorePayload 获取最终结果。
 * 断言：
 *  - API 入参包含 captureHistory 与 term 等关键字段。
 *  - versions[0] 为解析后的 JSON 对象，且 metadata.flavor 补齐。
 * 边界/异常：覆盖 JSON 分支的主流程。
 */
test("GivenJsonChunk_WhenStreamCompletes_ThenReturnsParsedEntry", async () => {
  const jsonEntry = { id: "1", term: "test", definitions: [], metadata: { origin: "model" } };
  streamWordApi.mockImplementation(async function* (options) {
    expect(options).toMatchObject({ term: "test", captureHistory: true });
    yield { type: "chunk", data: JSON.stringify(jsonEntry) };
  });

  const session = createSession();
  const chunks = [];
  for await (const payload of session.stream()) {
    chunks.push(payload);
  }

  expect(chunks).toEqual([
    {
      chunk: JSON.stringify(jsonEntry),
      language: baseRequest.language,
    },
  ]);
  expect(logger.info).toHaveBeenCalledWith(
    "[StreamWordSession] start",
    expect.objectContaining({ userId: baseRequest.userId, term: baseRequest.term }),
  );
  expect(logger.info).toHaveBeenCalledWith(
    "[StreamWordSession] end",
    expect.objectContaining({ userId: baseRequest.userId, term: baseRequest.term }),
  );

  const payload = session.getStorePayload();
  expect(payload.key).toBe(baseRequest.key);
  expect(payload.versions[0]).toMatchObject({ id: "1", metadata: { origin: "model" } });
  expect(payload.versions[0].markdown).toBeUndefined();
  expect(payload.options.metadata).toMatchObject({ flavor: baseRequest.flavor, origin: "model" });
  expect(payload.options.activeVersionId).toBe("1");
});

/**
 * 测试目标：验证纯 markdown 流返回时能够以 markdown 字段兜底。
 * 前置条件：流式接口仅返回文本片段，无法解析为 JSON。
 * 步骤：
 *  1) 运行 session.stream 并消费 chunk。
 *  2) 获取最终 payload。
 * 断言：
 *  - versions 中包含 markdown。
 *  - activeVersionId 退化为 undefined。
 * 边界/异常：覆盖非 JSON 路径。
 */
test("GivenMarkdownChunk_WhenStreamCompletes_ThenKeepsMarkdownEntry", async () => {
  streamWordApi.mockImplementation(async function* () {
    yield { type: "chunk", data: "# Title" };
  });

  const session = createSession();
  const chunks = [];
  for await (const payload of session.stream()) {
    chunks.push(payload);
  }

  expect(chunks).toEqual([{ chunk: "# Title", language: baseRequest.language }]);
  const payload = session.getStorePayload();
  expect(payload.versions[0]).toMatchObject({ term: "test", markdown: "# Title" });
  expect(payload.options.metadata).toMatchObject({ flavor: baseRequest.flavor });
  expect(payload.options.activeVersionId).toBeUndefined();
});

/**
 * 测试目标：验证 metadata 与 JSON 双轨混合时版本与元信息正确合并。
 * 前置条件：metadata 事件与 JSON chunk 均存在且指向同一版本 ID。
 * 步骤：
 *  1) 消费 session.stream。
 *  2) 读取合并后的 payload。
 * 断言：
 *  - versions 中对应版本被覆盖为最新 JSON 内容。
 *  - metadata 过滤掉 versions/activeVersionId，仅保留业务字段并补齐 flavor。
 * 边界/异常：覆盖混合场景。
 */
test("GivenMetadataAndJson_WhenStreamCompletes_ThenMergeVersionsAndMetadata", async () => {
  const metadata = {
    versions: [{ id: "v1", markdown: "old" }],
    activeVersionId: "v1",
    flavor: "MONO",
    reviewer: "r1",
  };
  const entry = { id: "v1", markdown: "new", metadata: { source: "llm" } };
  streamWordApi.mockImplementation(async function* () {
    yield { type: "metadata", data: JSON.stringify(metadata) };
    yield { type: "chunk", data: JSON.stringify(entry) };
  });

  const session = createSession({ request: { flavor: "BILINGUAL" } });
  for await (const _ of session.stream()) {
    // consume
  }

  const payload = session.getStorePayload();
  expect(payload.versions).toHaveLength(1);
  expect(payload.versions[0]).toMatchObject({ id: "v1", markdown: "new", flavor: "MONO" });
  expect(payload.options.metadata).toEqual({ flavor: "MONO", reviewer: "r1", source: "llm" });
  expect(payload.options.activeVersionId).toBe("v1");
});

/**
 * 测试目标：验证底层 API 抛错时异常会向上传递且不会生成 payload。
 * 前置条件：streamWordApi 抛出异常。
 * 步骤：
 *  1) 调用 session.stream 并捕获异常。
 *  2) 尝试获取 payload 触发保护。
 * 断言：
 *  - stream 调用抛出原始错误。
 *  - getStorePayload 抛出未完成提示。
 *  - 日志包含 error 记录。
 * 边界/异常：覆盖失败路径。
 */
test("GivenUpstreamError_WhenStreaming_ThenPropagateAndBlockPayload", async () => {
  streamWordApi.mockImplementation(async function* () {
    yield* [];
    throw new Error("upstream failure");
  });

  const session = createSession();
  await expect(
    (async () => {
      for await (const _ of session.stream()) {
        // no-op
      }
    })(),
  ).rejects.toThrow("upstream failure");
  expect(() => session.getStorePayload()).toThrow(
    "StreamWordSession has not completed streaming yet",
  );
  expect(logger.info).toHaveBeenCalledWith(
    "[StreamWordSession] error",
    expect.objectContaining({ userId: baseRequest.userId, term: baseRequest.term, error: expect.any(Error) }),
  );
});
