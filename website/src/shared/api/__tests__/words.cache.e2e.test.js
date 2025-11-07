import { jest } from "@jest/globals";

jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: () => ({ words: {} }),
}));

const { createWordsApi } = await import("@shared/api/words.js");
const { useWordStore } = await import("@core/store");
const { WORD_FLAVOR_BILINGUAL } = await import("@shared/utils/language.js");

const request = jest.fn();
const api = createWordsApi(request);

beforeEach(() => {
  useWordStore.getState().clear();
  request.mockClear();
});

/**
 * 首次 REST 查询后将 Markdown 写入缓存，二次直接读取时无需重复请求。
 */
test("fetchWord caches markdown across calls", async () => {
  const response = { id: "v1", term: "hello", markdown: "**hello**" };
  request.mockResolvedValueOnce(response);

  const result = await api.fetchWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  });

  expect(result.markdown).toBe("**hello**");
  expect(request).toHaveBeenCalledTimes(1);

  const cached = await api.fetchWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  });

  expect(cached.markdown).toBe("**hello**");
  expect(request).toHaveBeenCalledTimes(1);
});
