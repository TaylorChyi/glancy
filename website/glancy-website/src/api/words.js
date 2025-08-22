import { API_PATHS } from "@/config/api.js";
import { apiRequest } from "./client.js";
import { useApi } from "@/hooks";
import { createCachedFetcher, parseSse } from "@/utils";

/**
 * Query a word definition
 * @param {Object} opts
 * @param {string} opts.userId user identifier
 * @param {string} opts.term word to search
 * @param {string} opts.language CHINESE or ENGLISH
 * @param {string} [opts.token] user token for auth header
 */
export function createWordsApi(request = apiRequest) {
  const fetchWordImpl = async ({ userId, term, language, model, token }) => {
    const params = new URLSearchParams({ userId, term, language });
    if (model) params.append("model", model);
    return request(`${API_PATHS.words}?${params.toString()}`, { token });
  };

  const fetchWord = createCachedFetcher(
    fetchWordImpl,
    ({ term, language, model }) => `${language}:${term}:${model ?? ""}`,
  );

  const fetchWordAudioImpl = async ({ userId, term, language }) => {
    const params = new URLSearchParams({ userId, term, language });
    const resp = await request(`${API_PATHS.words}/audio?${params.toString()}`);
    return resp.blob();
  };

  const fetchWordAudio = createCachedFetcher(
    fetchWordAudioImpl,
    ({ term, language }) => `${language}:${term}`,
  );

  /**
   * 流式获取词汇释义并输出统一格式日志。
   * 日志格式:
   *   console.info("[streamWord] <阶段>", { userId, term, chunk?, error? })
   */
  async function* streamWord({
    userId,
    term,
    language,
    model,
    token,
    signal,
    onChunk,
  }) {
    const params = new URLSearchParams({ userId, term, language });
    if (model) params.append("model", model);
    const url = `${API_PATHS.words}/stream?${params.toString()}`;
    const headers = {
      Accept: "text/event-stream",
      ...(token ? { "X-USER-TOKEN": token } : {}),
    };
    const logCtx = { userId, term };
    let response;
    try {
      response = await fetch(url, {
        headers,
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      console.info("[streamWord] error", { ...logCtx, error: err });
      throw err;
    }
    console.info("[streamWord] start", logCtx);
    try {
      for await (const { event, data } of parseSse(response.body)) {
        if (event === "error") {
          console.info("[streamWord] error", { ...logCtx, error: data });
          throw new Error(data);
        }
        if (data === "[DONE]") break;
        if (data) {
          console.info("[streamWord] chunk", { ...logCtx, chunk: data });
          if (onChunk) onChunk(data);
          yield data;
        }
      }
      console.info("[streamWord] end", logCtx);
    } catch (err) {
      console.info("[streamWord] error", { ...logCtx, error: err });
      throw err;
    }
  }

  return { fetchWord, fetchWordAudio, streamWord };
}

export const { fetchWord, fetchWordAudio, streamWord } = createWordsApi();

export function useWordsApi() {
  return useApi().words;
}
