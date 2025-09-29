import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";

const fetchWordMock = jest.fn();

jest.unstable_mockModule("../useApi.js", () => ({
  useApi: () => ({
    words: { fetchWord: fetchWordMock },
  }),
}));

jest.unstable_mockModule("@/utils", () => ({
  resolveWordLanguage: jest.fn(() => "ENGLISH"),
  WORD_LANGUAGE_AUTO: "AUTO",
  WORD_FLAVOR_BILINGUAL: "BILINGUAL",
  WORD_DEFAULT_TARGET_LANGUAGE: "CHINESE",
}));

jest.unstable_mockModule("@/config", () => ({
  DEFAULT_MODEL: "DOUBAO",
}));

const { useFetchWord } = await import("../useFetchWord.js");

beforeEach(() => {
  fetchWordMock.mockReset();
});

/**
 * 测试逻辑:
 *  1. 指定目标语言为 ENGLISH 调用 fetchWordWithHandling。
 *  2. 断言底层 fetchWord 请求参数包含目标语言且语言已解析。
 *  3. 校验返回结构保留解析后的 targetLanguage 字段。
 */
test("passes target language through request and response", async () => {
  const user = { id: "user-1", token: "token" };
  const payload = { term: "serenity" };
  fetchWordMock.mockResolvedValueOnce({ id: "entry-1" });

  const { result } = renderHook(() => useFetchWord());
  let response;
  await act(async () => {
    response = await result.current.fetchWordWithHandling({
      user,
      term: payload.term,
      language: "AUTO",
      targetLanguage: "ENGLISH",
      flavor: "BILINGUAL",
    });
  });

  expect(fetchWordMock).toHaveBeenCalledWith(
    expect.objectContaining({
      term: payload.term,
      language: "ENGLISH",
      targetLanguage: "ENGLISH",
      flavor: "BILINGUAL",
    }),
  );
  expect(response).toMatchObject({
    targetLanguage: "ENGLISH",
    language: "ENGLISH",
    error: null,
  });
});
