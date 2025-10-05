const MARKDOWN_KEY = '"markdown"';

const WHITESPACE_RE = /\s/;

const NEWLINE_NORMALIZER = /\r\n?|\u2028|\u2029/g;
const HEADING_WITHOUT_SPACE = /^(#{1,6})([^\s#])/gm;
const LIST_MARKER_WITHOUT_GAP = /^(\d+[.)])([^\s])/gm;
const HEADING_WITHOUT_PADDING = /([^\n])\n(#{1,6}\s)/g;
const HEADING_STUCK_TO_PREVIOUS = /([^\n\s])((?:#{1,6})(?=\S))/g;
const INLINE_LABEL_PATTERN =
  /([^\n])((?:[ \t]*\t[ \t]*)|(?:[ \t]{2,}))(\*\*([^*]+)\*\*:[^\n]*)/g;

// 说明：
//  - LLM 在英译英响应中可能仅保留单个空格作为段落分隔。
//  - 若仅依赖 `INLINE_LABEL_PATTERN`（要求至少两个空格），上述场景会漏判。
//  - 为保持缩进计算逻辑复用，单空格匹配交由二次替换时处理。
const INLINE_LABEL_SINGLE_SPACE_PATTERN =
  /(\S)([ \t])(?=\*\*([^*]+)\*\*:[^\n]*)/g;

const INLINE_LABEL_CAMEL_CASE = /([a-z])(\p{Lu})/gu;

const INLINE_LABEL_DELIMITER = /[^a-z\u4e00-\u9fff]+/giu;

// 说明：
//  - 这些标签来自后端 Markdown 解析器的 Section 定义，覆盖了 LLM 输出中常见的段落元信息。
//  - 目标是保持前后端对「需要独立换行的行内标签」的识别一致，避免前端额外维护语言分支。
//  - 如需扩展新的标签，请与后端 `MarkdownWordExtractor` 的 `resolveSection` 保持同步，防止两端语义漂移。
const INLINE_LABEL_TOKENS = new Set(
  [
    "translation",
    "translations",
    "definition",
    "definitions",
    "meaning",
    "meanings",
    "example",
    "examples",
    "synonym",
    "synonyms",
    "antonym",
    "antonyms",
    "related",
    "relatedwords",
    "variation",
    "variations",
    "phrase",
    "phrases",
    "phonetic",
    "pronunciation",
    "释义",
    "解释",
    "含义",
    "例句",
    "用法示例",
    "用例",
    "翻译",
    "同义词",
    "反义词",
    "相关词",
    "相关词汇",
    "变体",
    "变形",
    "词形",
    "常见词组",
    "词组",
    "发音",
    "british",
    "american",
    "audio",
    "audionotes",
    "frequency",
    "frequencyband",
    "proficiency",
    "benchmark",
    "proficiencybenchmark",
    "entry",
    "entrytype",
    "register",
    "registerlabels",
    "regional",
    "regionalvariation",
    "spelling",
    "capitalization",
    "variants",
    "spellingorcapitalizationvariants",
    "proper",
    "propernounhandling",
    "nuance",
    "semantic",
    "semanticfield",
    "usage",
    "usageinsight",
    "insight",
    "extended",
    "extendednotes",
  ].map((token) => token.toLowerCase()),
);

function isLikelyJson(text) {
  if (!text) return false;
  const first = text.trimStart()[0];
  return first === "{" || first === "[";
}

function normalizeNewlines(text) {
  return text.replace(NEWLINE_NORMALIZER, "\n");
}

function ensureHeadingSpacing(text) {
  return text.replace(
    HEADING_WITHOUT_SPACE,
    (_, hashes, rest) => `${hashes} ${rest}`,
  );
}

function ensureHeadingPadding(text) {
  return text.replace(
    HEADING_WITHOUT_PADDING,
    (_, before, heading) => `${before}\n\n${heading}`,
  );
}

function ensureHeadingLineBreak(text) {
  return text.replace(
    HEADING_STUCK_TO_PREVIOUS,
    (match, before, hashes, offset, source) => {
      const hashIndex = offset + before.length;
      if (hashes.length === 1) {
        const lineStart = source.lastIndexOf("\n", hashIndex - 1) + 1;
        const lineBefore = source.slice(lineStart, hashIndex);
        const hasHeadingCue = /[:：)）】]/u.test(lineBefore);
        if (!hasHeadingCue) {
          return match;
        }
      }
      return `${before}\n${hashes}`;
    },
  );
}

function ensureListSpacing(text) {
  return text.replace(
    LIST_MARKER_WITHOUT_GAP,
    (_, marker, rest) => `${marker} ${rest}`,
  );
}

function computeListIndentation(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset) + 1;
  const line = source.slice(lineStart, offset + 1);
  const markerMatch = line.match(/^([ \t]*)(?:([-*+])|((?:\d+[.)])))(\s+)/);
  if (!markerMatch) {
    return null;
  }
  const [, leading = "", bullet = "", numbered = "", gap = ""] = markerMatch;
  const marker = bullet || numbered;
  const visualizedMarker = marker.replace(/[^\s]/g, " ");
  return `${leading}${visualizedMarker}${gap.replace(/[^\s]/g, " ")}`;
}

/**
 * 背景：
 *  - 英译英字典输出会引入诸如“Pronunciation-British”或“AudioNotes”一类驼峰/连字符标签，
 *    若仅做简单去符号匹配会导致行内标签无法断行。
 * 目的：
 *  - 将不同形态（驼峰、连字符、空格）的标签拆解为语义关键词，复用同一套词表判断是否需要换行。
 * 关键决策与取舍：
 *  - 通过正则在小写化前先断开驼峰，再按非字母分割，避免维护额外的语言分支。
 * 影响范围：
 *  - 行内标签换行判断逻辑，覆盖中英双语与英译英场景。
 */
function collectInlineLabelKeywords(raw) {
  if (!raw) {
    return [];
  }
  const camelSeparated = raw
    .replace(/：/g, ":")
    .replace(INLINE_LABEL_CAMEL_CASE, "$1 $2")
    .toLowerCase();
  return camelSeparated
    .split(INLINE_LABEL_DELIMITER)
    .map((token) => token.trim())
    .filter(Boolean);
}

function shouldSplitInlineLabel(label) {
  const keywords = collectInlineLabelKeywords(label);
  if (keywords.length === 0) {
    return false;
  }
  if (keywords.some((token) => INLINE_LABEL_TOKENS.has(token))) {
    return true;
  }
  const collapsed = keywords.join("");
  return INLINE_LABEL_TOKENS.has(collapsed);
}

// 背景：
//  - 英译英响应在压缩空格后，常仅保留一个空格连接释义与后续标签。
//  - 为避免破坏列表结构，需在转换前对这些「单空格」进行定向扩充，
//    使其满足统一的换行判定条件。
function normalizeInlineLabelSpacing(text) {
  return text.replace(
    INLINE_LABEL_SINGLE_SPACE_PATTERN,
    (match, before, space, label, offset, source) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const lineStart = source.lastIndexOf("\n", offset) + 1;
      const prefix = source.slice(lineStart, offset + 1).trim();
      const isListMarker =
        prefix.length > 0 && (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));
      if (isListMarker) {
        return match;
      }
      return `${before}${space}${space}`;
    },
  );
}

function ensureInlineLabelLineBreak(text) {
  const normalizedSpacing = normalizeInlineLabelSpacing(text);
  return normalizedSpacing.replace(
    INLINE_LABEL_PATTERN,
    (match, before, spaces, segment, label, offset, source) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      if (spaces.length === 1) {
        // 背景：列表项首个标签通常仅由一个空格与标记（-、1. 等）分隔，
        // 若直接换行会破坏列表结构并阻断后续标签的匹配。
        // 取舍：通过回溯行首判断当前匹配是否仍在列表标记后，若是则保持原样。
        const lineStart = source.lastIndexOf("\n", offset) + 1;
        const prefix = source.slice(lineStart, offset + 1).trim();
        const isListMarker =
          prefix.length > 0 && (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));
        if (isListMarker) {
          return match;
        }
      }
      const indent =
        computeListIndentation(source, offset) || spaces.replace(/\S/g, " ");
      return `${before}\n${indent}${segment}`;
    },
  );
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
    if (ch === "\\") {
      const next = source[index + 1];
      if (next === undefined) {
        raw += "\\";
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

export function polishDictionaryMarkdown(source) {
  if (!source) return "";
  const normalized = normalizeNewlines(source);
  const withLineBreak = ensureHeadingLineBreak(normalized);
  const withHeadingSpacing = ensureHeadingSpacing(withLineBreak);
  const padded = ensureHeadingPadding(withHeadingSpacing);
  const spaced = ensureListSpacing(padded);
  return ensureInlineLabelLineBreak(spaced);
}
