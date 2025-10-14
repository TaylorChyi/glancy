import { jest } from "@jest/globals";

const streamWordMock = jest.fn(async function* () {
  yield { type: "chunk", data: "**hello**" };
});

jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: () => ({ words: { streamWord: streamWordMock } }),
}));

const { createWordsApi } = await import("@shared/api/words.js");
const { useStreamWord } = await import("@shared/hooks");
const { useWordStore } = await import("@core/store");
const { WORD_FLAVOR_BILINGUAL } = await import("@shared/utils/language.js");

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
    flavor: WORD_FLAVOR_BILINGUAL,
  })) {
    // consume stream
  }

  const result = await api.fetchWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  });

  expect(result.markdown).toBe("**hello**");
  expect(request).not.toHaveBeenCalled();
});
