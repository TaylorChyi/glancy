import { API_PATHS, DEFAULT_MODEL } from "@/config";
import { apiRequest } from "./client.js";
import { useApi } from "@/hooks";
import { createCachedFetcher, parseSse } from "@/utils";
import { useWordStore } from "@/store/wordStore.js";

export const WORD_CACHE_VERSION = "md1";

export const wordCacheKey = ({ term, language, model = DEFAULT_MODEL }) =>
  `${language}:${term}:${model ?? ""}:${WORD_CACHE_VERSION}`;

/**
 * Query a word definition
 * @param {Object} opts
 * @param {string} opts.userId user identifier
 * @param {string} opts.term word to search
 * @param {string} opts.language CHINESE or ENGLISH
 * @param {string} [opts.token] user token for auth header
 */
export function createWordsApi(request = apiRequest) {
  const store = useWordStore;

  const resolveKey = ({ term, language, model = DEFAULT_MODEL }) =>
    wordCacheKey({ term, language, model });

  const persistWordRecord = (key, response) => {
    if (!response) return undefined;
    const versions = Array.isArray(response.versions)
      ? response.versions
      : response.version
        ? [response.version]
        : Array.isArray(response.entries)
          ? response.entries
          : [response];
    const activeVersionId =
      response.activeVersionId ??
      response.version?.id ??
      response.version?.versionId ??
      versions[versions.length - 1]?.id ??
      versions[versions.length - 1]?.versionId;
    const metadata = response.metadata ?? {};
    store.getState().setVersions(key, versions, {
      activeVersionId,
      metadata,
    });
    return store.getState().getEntry(key, activeVersionId);
  };

  const fetchWordImpl = async ({
    userId,
    term,
    language,
    model = DEFAULT_MODEL,
    token,
  }) => {
    const key = resolveKey({ term, language, model });
    const cached = store.getState().getEntry(key);
    if (cached) return cached;
    const params = new URLSearchParams({ userId, term, language });
    if (model) params.append("model", model);
    const result = await request(`${API_PATHS.words}?${params.toString()}`, {
      token,
    });
    return persistWordRecord(key, result);
  };

  const fetchWord = createCachedFetcher(fetchWordImpl, resolveKey);

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
    model = DEFAULT_MODEL,
    token,
    signal,
    onChunk,
    forceNew = false,
    versionId,
  }) {
    const params = new URLSearchParams({ userId, term, language });
    if (model) params.append("model", model);
    if (forceNew) params.append("forceNew", "true");
    if (versionId) params.append("versionId", versionId);
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
        if (event === "metadata") {
          console.info("[streamWord] metadata", { ...logCtx, data });
          yield { type: "metadata", data };
          continue;
        }
        if (data) {
          console.info("[streamWord] chunk", { ...logCtx, chunk: data });
          if (onChunk) onChunk(data);
          yield { type: "chunk", data };
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
