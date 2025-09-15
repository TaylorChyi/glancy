import { API_PATHS } from "@/config/api.js";
import { apiRequest } from "./client.js";

/**
 * Create TTS API helpers.
 * Each method returns the raw fetch response or parsed JSON depending on
 * content type, allowing callers to handle 204 responses gracefully.
 */
export function createTtsApi(request = apiRequest) {
  const post = (path, { token, ...body }) =>
    request(path, {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const speakWord = (opts) => post(API_PATHS.ttsWord, opts);
  const speakSentence = (opts) => post(API_PATHS.ttsSentence, opts);
  const fetchVoices = ({ lang, token } = {}) => {
    if (!lang) {
      throw new Error("Language is required to load voices");
    }
    const params = new URLSearchParams({ lang });
    return request(`${API_PATHS.ttsVoices}?${params.toString()}`, { token });
  };

  return { speakWord, speakSentence, fetchVoices };
}

export const { speakWord, speakSentence, fetchVoices } = createTtsApi();
