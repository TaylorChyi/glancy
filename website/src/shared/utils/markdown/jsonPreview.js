import { NEWLINE_NORMALIZER } from "./constants/index.js";
import { decodeJsonString } from "./jsonStringParser.js";
import { findMarkdownValue } from "./markdownJsonScanner.js";

export function normalizeNewlines(text) {
  return text.replace(NEWLINE_NORMALIZER, "\n");
}

function isLikelyJson(text) {
  if (!text) return false;
  const first = text.trimStart()[0];
  return first === "{" || first === "[";
}

export function extractMarkdownPreview(buffer) {
  if (!buffer) return "";
  if (!isLikelyJson(buffer)) {
    return normalizeNewlines(buffer);
  }
  const trimmed = buffer.trimStart();
  const value = findMarkdownValue(trimmed);
  if (!value) return null;
  if (!value.raw) return "";
  return decodeJsonString(value.raw);
}
