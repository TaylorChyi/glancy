import { jest } from "@jest/globals";

const streamWordMock = jest.fn(async function* () {
  yield "**hello**";
});

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: () => ({ words: { streamWord: streamWordMock } }),
}));

const { createWordsApi } = await import("@/api/words.js");
const { useStreamWord } = await import("@/hooks");
const { useWordStore } = await import("@/store");

const request = jest.fn();
const api = createWordsApi(request);

beforeEach(() => {
  useWordStore.getState().clear();
  request.mockClear();
});

/**
 * 首次流式查询后将 Markdown 写入缓存，二次直接读取时无需网络请求。
 */
test("streams then reads markdown from cache", async () => {
  const stream = useStreamWord();
  const user = { id: "u", token: "t" };
  for await (const _ of stream({
    user,
    term: "hello",
    language: "ENGLISH",
  })) {
    // consume stream
  }

  const result = await api.fetchWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
  });

  expect(result.markdown).toBe("**hello**");
  expect(request).not.toHaveBeenCalled();
});
