import { createWordsApi } from "../words.js";
import { API_PATHS } from "../../config/api.js";
import { DEFAULT_MODEL } from "../../config/index.js";
import { WORD_FLAVOR_BILINGUAL } from "@/utils/language.js";
import { useWordStore } from "@/store/wordStore.js";
import { jest } from "@jest/globals";

/**
 * 验证查询参数构建正确并携带 token。
 */
test("fetchWord builds query string", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createWordsApi(request);
  await api.fetchWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
    token: "t",
  });
  const [url, opts] = request.mock.calls[0];
  expect(url).toBe(
    `${API_PATHS.words}?userId=u&term=hello&language=ENGLISH&flavor=${WORD_FLAVOR_BILINGUAL}&model=${DEFAULT_MODEL}`,
  );
  expect(opts.token).toBe("t");
});

/**
 * 确认单词查询结果会被缓存，重复调用不会再次请求远端。
 */
test("fetchWord caches repeated queries", async () => {
  const request = jest.fn().mockResolvedValue({ word: "hello" });
  const api = createWordsApi(request);
  const args = {
    userId: "u",
    term: "hello",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  };
  await api.fetchWord(args);
  await api.fetchWord(args);
  expect(request).toHaveBeenCalledTimes(1);
});

/**
 * 确认音频查询同样使用缓存避免重复请求。
 */
test("fetchWordAudio caches repeated queries", async () => {
  const blob = new Blob();
  const request = jest.fn().mockResolvedValue({ blob: () => blob });
  const api = createWordsApi(request);
  const args = { userId: "u", term: "hello", language: "ENGLISH" };
  const first = await api.fetchWordAudio(args);
  const second = await api.fetchWordAudio(args);
  expect(request).toHaveBeenCalledTimes(1);
  expect(second).toBe(first);
});
beforeEach(() => {
  useWordStore.getState().clear();
});
