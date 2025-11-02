/**
 * 背景：
 *  - 英文标点与中日韩字符间缺少空格会影响阅读体验，尤其在例句合集中尤为明显。
 * 目的：
 *  - 识别可安全补空格的位置，并跳过代码块或数字场景，避免误改。
 */
import {
  ASCII_PUNCTUATION,
  ASCII_PUNCTUATION_BOUNDARY,
} from "./constants/index.js";
import {
  isAsciiDigit,
  isAsciiUppercase,
  isCjkPunctuation,
  isHanChar,
  isSpacingCandidate,
} from "./characters.js";

function countBackticks(source, startIndex) {
  let length = 0;
  while (source[startIndex + length] === "`") {
    length += 1;
  }
  return length;
}

function shouldSkipPeriodSpacing(source, index) {
  const prev = source[index - 1];
  const next = source[index + 1];
  if (prev === "." || next === ".") {
    return true;
  }
  if (prev && next && isAsciiDigit(prev) && isAsciiDigit(next)) {
    return true;
  }
  if (prev && next && isAsciiUppercase(prev) && isAsciiUppercase(next)) {
    return true;
  }
  return false;
}

function shouldInsertPeriodSpace(prev, next) {
  if (!isSpacingCandidate(prev)) {
    return false;
  }
  if (isHanChar(next)) {
    return true;
  }
  return isAsciiUppercase(next);
}

export function ensureEnglishPunctuationSpacing(text) {
  if (!text) {
    return text;
  }
  let result = "";
  let activeFenceSize = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "`") {
      const fenceSize = countBackticks(text, i);
      result += "`".repeat(fenceSize);
      i += fenceSize - 1;
      if (activeFenceSize === 0) {
        activeFenceSize = fenceSize;
      } else if (fenceSize >= activeFenceSize) {
        activeFenceSize = 0;
      }
      continue;
    }
    result += char;
    if (activeFenceSize > 0) {
      continue;
    }
    if (!ASCII_PUNCTUATION.has(char)) {
      continue;
    }
    const prev = text[i - 1];
    const next = text[i + 1];
    if (char === "." && shouldSkipPeriodSpacing(text, i)) {
      continue;
    }
    if (!next) {
      continue;
    }
    if (/\s/.test(next)) {
      continue;
    }
    if (ASCII_PUNCTUATION.has(next)) {
      continue;
    }
    if (ASCII_PUNCTUATION_BOUNDARY.has(next)) {
      continue;
    }
    if (isCjkPunctuation(next)) {
      continue;
    }
    if (!isSpacingCandidate(prev) || !isSpacingCandidate(next)) {
      continue;
    }
    if (char === "." && !shouldInsertPeriodSpace(prev, next)) {
      continue;
    }
    result += " ";
  }
  return result;
}
