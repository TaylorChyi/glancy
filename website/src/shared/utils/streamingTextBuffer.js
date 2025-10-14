/**
 * 背景：
 *  - Doubao 等流式模型在增量输出时按“词”粒度拆片，默认不携带空格与回车信号，导致前端渲染阶段出现单词粘连。
 * 目的：
 *  - 采用“适配器模式”为流式片段提供统一的空白符补齐策略，屏蔽上层对分词格式的差异感知。
 * 关键决策与取舍：
 *  - 通过状态化缓冲区记录历史尾字符，仅在确认为独立英文词或需要标点后空格时插入空格，避免误伤中文等无需空格的场景；
 *  - 对回车符统一归一化为换行符，同时支持扩展自定义换行标记，兼顾不同上游协议。
 * 影响范围：
 *  - 被 ChatView 等流式渲染调用后，能够保障英文内容在流式过程中保持可读性；
 *  - 新增空白符逻辑仅作用于展示层，不影响底层 JSON 累积或缓存命中。
 * 演进与TODO：
 *  - 如后续需要识别更细粒度的语种，可在 `isWordLikeChar` 中扩展脚本判定；
 *  - 支持配置化的标点空格策略，兼容不同语系的排版规范。
 */
const DEFAULT_NEWLINE_TOKENS = new Set();

const WORD_LIKE_CHAR = /[A-Za-z\d]/;
const HAN_SCRIPT = /\p{Script=Han}/u;
// 说明：追加句号以覆盖「英文释义以句号结束后紧跟新句」的流式场景，
//       避免 Doubao 词典输出在 `.` 与下一个单词之间缺失空格。
const TRAILING_SPACE_PUNCTUATION = /[.,:;!?]/;
const WHITESPACE_RE = /\s/u;

function normalizeNewlines(text, newlineTokens) {
  let result = text.replace(/\r\n?|\u2028|\u2029/g, "\n");
  if (newlineTokens.size === 0) {
    return result;
  }
  for (const token of newlineTokens) {
    if (!token) continue;
    result = result.split(token).join("\n");
  }
  return result;
}

function getLastVisibleChar(text) {
  for (let index = text.length - 1; index >= 0; index -= 1) {
    const char = text[index];
    if (!WHITESPACE_RE.test(char)) {
      return char;
    }
  }
  return "";
}

function getFirstVisibleChar(text) {
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!WHITESPACE_RE.test(char)) {
      return char;
    }
  }
  return "";
}

function isWordLikeChar(char) {
  if (!char) return false;
  if (HAN_SCRIPT.test(char)) {
    return false;
  }
  return WORD_LIKE_CHAR.test(char);
}

function shouldInsertSpace(previousTail, addition) {
  if (!addition) {
    return false;
  }
  if (addition[0] === "\n" || addition.startsWith(" ")) {
    return false;
  }
  if (previousTail.endsWith("\n")) {
    return false;
  }
  const last = getLastVisibleChar(previousTail);
  if (!last) {
    return false;
  }
  const next = getFirstVisibleChar(addition);
  if (!next) {
    return false;
  }
  if (isWordLikeChar(last) && isWordLikeChar(next)) {
    return true;
  }
  if (TRAILING_SPACE_PUNCTUATION.test(last) && isWordLikeChar(next)) {
    return true;
  }
  return false;
}

export function createStreamingTextBuffer(options = {}) {
  const newlineTokens = new Set(
    options.newlineTokens || DEFAULT_NEWLINE_TOKENS,
  );
  let buffer = "";

  return {
    append(chunk) {
      if (chunk == null) {
        return buffer;
      }
      const normalized = normalizeNewlines(String(chunk), newlineTokens);
      if (!normalized) {
        return buffer;
      }
      const addition = shouldInsertSpace(buffer, normalized)
        ? ` ${normalized}`
        : normalized;
      buffer += addition;
      return buffer;
    },
    reset() {
      buffer = "";
    },
    value() {
      return buffer;
    },
  };
}

export const __internal__testables = {
  normalizeNewlines,
  shouldInsertSpace,
  getLastVisibleChar,
  getFirstVisibleChar,
  isWordLikeChar,
};
