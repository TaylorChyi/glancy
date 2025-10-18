/**
 * 背景：
 *  - Doubao 的流式响应可能先返回 JSON 片段，再逐步补全 markdown 字段。
 * 目的：
 *  - 提供容错的预览提取器，兼容纯 Markdown、完整 JSON、以及尚未闭合的 JSON 流。
 * 关键决策与取舍：
 *  - 仅依赖字符串扫描避免引入 JSON.parse，确保在不完整流时也能返回已有片段；
 *  - 将换行归一化逻辑与 JSON 解析解耦，便于在其它模块复用。
 * 影响范围：
 *  - Chat/词典 streaming 预览；polishDictionaryMarkdown 的前置输入处理。
 * 演进与TODO：
 *  - 若后续协议调整字段命名，可在 MARKDOWN_KEY 与 findMarkdownValue 中更新匹配策略。
 */
import { NEWLINE_NORMALIZER } from "./constants/index.js";

const MARKDOWN_KEY = '"markdown"';
const WHITESPACE_RE = /\s/;
const SIMPLE_ESCAPE_MAPPINGS = new Map([
  ["\\", "\\"],
  ['"', '"'],
  ["'", "'"],
  ["/", "/"],
  ["b", "\b"],
  ["f", "\f"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
]);

export function normalizeNewlines(text) {
  return text.replace(NEWLINE_NORMALIZER, "\n");
}

function isLikelyJson(text) {
  if (!text) return false;
  const first = text.trimStart()[0];
  return first === "{" || first === "[";
}

function decodeUnicodeSequence(raw, startIndex) {
  const code = raw.slice(startIndex, startIndex + 4);
  const isValid = code.length === 4 && /^[0-9a-fA-F]+$/.test(code);
  if (!isValid) {
    return { char: "\\u", advance: 1 };
  }
  return {
    char: String.fromCharCode(parseInt(code, 16)),
    advance: 5,
  };
}

function decodeEscapedSequence(raw, index) {
  const next = raw[index + 1];
  if (next === undefined) {
    return { char: "\\", advance: 0 };
  }
  if (next === "u") {
    return decodeUnicodeSequence(raw, index + 2);
  }
  const mapped = SIMPLE_ESCAPE_MAPPINGS.get(next);
  if (mapped !== undefined) {
    return { char: mapped, advance: 1 };
  }
  return { char: next, advance: 1 };
}

function decodeJsonString(raw) {
  let result = "";
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== "\\") {
      result += char;
      continue;
    }
    const { char: decoded, advance } = decodeEscapedSequence(raw, i);
    result += decoded;
    i += advance;
  }
  return result;
}

function readJsonString(source, startIndex) {
  let result = "";
  let index = startIndex + 1;
  let closed = false;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      const next = source[index + 1];
      if (next === undefined) {
        result += "\\";
        break;
      }
      result += char;
      result += next;
      index += 2;
      continue;
    }
    if (char === '"') {
      closed = true;
      index += 1;
      break;
    }
    result += char;
    index += 1;
  }
  return { raw: result, closed };
}

function seekMarkdownKey(buffer) {
  let index = 0;
  while (index < buffer.length) {
    if (buffer.startsWith(MARKDOWN_KEY, index)) {
      return index + MARKDOWN_KEY.length;
    }
    index += 1;
  }
  return -1;
}

function skipWhitespace(buffer, startIndex) {
  let index = startIndex;
  while (index < buffer.length && WHITESPACE_RE.test(buffer[index])) {
    index += 1;
  }
  return index;
}

function findMarkdownValue(buffer) {
  const keyIndex = seekMarkdownKey(buffer);
  if (keyIndex === -1) {
    return null;
  }
  let index = skipWhitespace(buffer, keyIndex);
  if (buffer[index] !== ":") {
    return null;
  }
  index = skipWhitespace(buffer, index + 1);
  if (index >= buffer.length) {
    return null;
  }
  if (buffer.startsWith("null", index)) {
    return { raw: "", closed: true };
  }
  if (buffer[index] !== '"') return null;
  return readJsonString(buffer, index);
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
