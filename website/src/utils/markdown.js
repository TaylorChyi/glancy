const MARKDOWN_KEY = "\"markdown\"";

const WHITESPACE_RE = /\s/;

const NEWLINE_NORMALIZER = /\r\n?|\u2028|\u2029/g;

function isLikelyJson(text) {
  if (!text) return false;
  const first = text.trimStart()[0];
  return first === "{" || first === "[";
}

function normalizeNewlines(text) {
  return text.replace(NEWLINE_NORMALIZER, "\n");
}

function decodeJsonString(raw) {
  let result = "";
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== "\\") {
      result += char;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) {
      result += "\\";
      break;
    }
    switch (next) {
      case "\\":
      case '"':
      case "'":
        result += next;
        i += 1;
        break;
      case "n":
        result += "\n";
        i += 1;
        break;
      case "r":
        result += "\r";
        i += 1;
        break;
      case "t":
        result += "\t";
        i += 1;
        break;
      case "b":
        result += "\b";
        i += 1;
        break;
      case "f":
        result += "\f";
        i += 1;
        break;
      case "u": {
        const hex = raw.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCharCode(parseInt(hex, 16));
          i += 5;
        } else {
          result += "\\u";
          i += 1;
        }
        break;
      }
      default:
        result += next;
        i += 1;
        break;
    }
  }
  return normalizeNewlines(result);
}

function readJsonString(source, startIndex) {
  if (source[startIndex] !== '"') return null;
  let index = startIndex + 1;
  let raw = "";
  while (index < source.length) {
    const ch = source[index];
    if (ch === '\\') {
      const next = source[index + 1];
      if (next === undefined) {
        raw += '\\';
        index += 1;
        break;
      }
      raw += ch + next;
      index += 2;
      continue;
    }
    if (ch === '"') {
      return { raw, closed: true, endIndex: index + 1 };
    }
    raw += ch;
    index += 1;
  }
  return { raw, closed: false, endIndex: index };
}

function findMarkdownValue(buffer) {
  const keyIndex = buffer.indexOf(MARKDOWN_KEY);
  if (keyIndex === -1) return null;
  let index = keyIndex + MARKDOWN_KEY.length;
  while (index < buffer.length && WHITESPACE_RE.test(buffer[index])) {
    index += 1;
  }
  if (buffer[index] !== ":") return null;
  index += 1;
  while (index < buffer.length && WHITESPACE_RE.test(buffer[index])) {
    index += 1;
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

