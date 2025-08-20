import { API_PATHS } from "@/config/api.js";
import { apiRequest } from "./client.js";
import { useApi } from "@/hooks";
import { createCachedFetcher, logStream } from "@/utils";

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
   * Stream word definition via SSE with structured logging.
   * Logs: [streamWord] start|chunk|end|error with { term, userId, chunk? }.
   */
  async function* streamWordWithHandling({
    userId,
    term,
    language,
    model,
    token,
    signal,
  }) {
    const params = new URLSearchParams({ userId, term, language });
    if (model) params.append("model", model);
    const url = `${API_PATHS.words}/stream?${params.toString()}`;
    const headers = token ? { "X-USER-TOKEN": token } : {};
    logStream("streamWord", "start", { term, userId });
    let response;
    try {
      response = await fetch(url, { headers, signal });
    } catch (err) {
      logStream("streamWord", "error", { term, userId, error: err });
      throw err;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const text = line.replace(/^data:\s*/, "");
          logStream("streamWord", "chunk", { term, userId, chunk: text });
          yield text;
        }
      }
      logStream("streamWord", "end", { term, userId });
    } catch (err) {
      logStream("streamWord", "error", { term, userId, error: err });
      throw err;
    }
  }

  return { fetchWord, fetchWordAudio, streamWordWithHandling };
}

export const { fetchWord, fetchWordAudio, streamWordWithHandling } =
  createWordsApi();

export function useWordsApi() {
  return useApi().words;
}
