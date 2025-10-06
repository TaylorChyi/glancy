import { createWordsApi } from "../words.js";
import { API_PATHS } from "../../config/api.js";
import { DEFAULT_MODEL } from "../../config/index.js";
import { WORD_FLAVOR_BILINGUAL } from "@/utils/language.js";
import { useWordStore } from "@/store/wordStore.js";
import { useDataGovernanceStore } from "@/store";
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
    `${API_PATHS.words}?userId=u&term=hello&language=ENGLISH&flavor=${WORD_FLAVOR_BILINGUAL}&model=${DEFAULT_MODEL}&captureHistory=true`,
  );
  expect(opts.token).toBe("t");
});

/**
 * 测试目标：停用历史采集时查询参数包含 captureHistory=false。\
 * 前置条件：historyCaptureEnabled 设置为 false。\
 * 步骤：\
 *  1) 调用 fetchWord。\
 * 断言：\
 *  - 请求 URL 包含 captureHistory=false。\
 * 边界/异常：覆盖关闭历史采集的路径。\
 */
test("fetchWord passes captureHistory=false when disabled", async () => {
  useDataGovernanceStore.setState({ historyCaptureEnabled: false });
  const request = jest.fn().mockResolvedValue({});
  const api = createWordsApi(request);
  await api.fetchWord({
    userId: "u",
    term: "hello",
    language: "ENGLISH",
  });
  const [url] = request.mock.calls[0];
  expect(url).toBe(
    `${API_PATHS.words}?userId=u&term=hello&language=ENGLISH&flavor=${WORD_FLAVOR_BILINGUAL}&model=${DEFAULT_MODEL}&captureHistory=false`,
  );
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
  useDataGovernanceStore.setState({ historyCaptureEnabled: true });
});
