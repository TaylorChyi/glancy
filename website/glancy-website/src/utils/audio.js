/**
 * Decode base64 TTS audio data to a Blob URL.
 *
 * @param {Object} params
 * @param {string} params.data Base64 encoded audio data
 * @param {string} params.format Audio format, e.g. "mp3"
 * @returns {string} Object URL representing the decoded audio
 */
const MIME_TYPES = {
  mp3: "audio/mpeg",
};

export function decodeTtsAudio({ data, format }) {
  const base64 = data.split(",").pop();
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: MIME_TYPES[format] ?? `audio/${format}`,
  });
  return URL.createObjectURL(blob);
}
