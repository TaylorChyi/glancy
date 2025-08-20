import { API_PATHS } from "@/config/api.js";
import { apiRequest } from "./client.js";
import { useApi } from "@/hooks";
import { createCachedFetcher } from "@/utils";

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

  async function* streamWord({ userId, term, language, model, token, signal }) {
    const params = new URLSearchParams({ userId, term, language });
    if (model) params.append("model", model);
    const url = `${API_PATHS.words}/stream?${params.toString()}`;
    const headers = token ? { "X-USER-TOKEN": token } : {};
    let response;
    try {
      response = await fetch(url, { headers, signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      console.info("streamWord error", err);
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
          console.info("streamWord chunk", text);
          yield text;
        }
      }
    } catch (err) {
      console.info("streamWord error", err);
      throw err;
    }
  }

  return { fetchWord, fetchWordAudio, streamWord };
}

export const { fetchWord, fetchWordAudio, streamWord } = createWordsApi();

export function useWordsApi() {
  return useApi().words;
}
