import { API_PATHS } from "@/config/api.js";
import { apiRequest } from "./client.js";

/**
 * Create TTS API helpers.
 * Each method returns the raw fetch response or parsed JSON depending on
 * content type, allowing callers to handle 204 responses gracefully.
 */
export function createTtsApi(request = apiRequest) {
  const post = (path, { userId, token, ...body }) => {
    const params = new URLSearchParams({ userId });
    return request(`${path}?${params.toString()}`, {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const speakWord = (opts) => post(API_PATHS.ttsWord, opts);
  const speakSentence = (opts) => post(API_PATHS.ttsSentence, opts);
  const fetchVoices = async ({ lang, token } = {}) => {
    const params = new URLSearchParams();
    if (lang) params.set("lang", lang);
    const query = params.toString();
    const resp = await request(
      query ? `${API_PATHS.ttsVoices}?${query}` : API_PATHS.ttsVoices,
      { token },
    );
    const options = resp?.options;
    return Array.isArray(options) ? options : [];
  };

  return { speakWord, speakSentence, fetchVoices };
}

export const { speakWord, speakSentence, fetchVoices } = createTtsApi();
