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

const PERIOD_SKIP_CHECKS = [
  ({ prev, next }) => prev === "." || next === ".",
  ({ prev, next }) =>
    Boolean(prev && next && isAsciiDigit(prev) && isAsciiDigit(next)),
  ({ prev, next }) =>
    Boolean(prev && next && isAsciiUppercase(prev) && isAsciiUppercase(next)),
];

function shouldSkipPeriodSpacing(source, index) {
  const prev = source[index - 1];
  const next = source[index + 1];
  const context = { prev, next };
  return PERIOD_SKIP_CHECKS.some((check) => check(context));
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

const handleBacktickFence = ({ text, index, activeFenceSize }) => {
  if (text[index] !== "`") {
    return {
      handled: false,
      nextIndex: index,
      activeFenceSize,
      segment: "",
    };
  }
  const fenceSize = countBackticks(text, index);
  const nextActiveFence =
    activeFenceSize === 0
      ? fenceSize
      : fenceSize >= activeFenceSize
        ? 0
        : activeFenceSize;
  return {
    handled: true,
    nextIndex: index + fenceSize,
    activeFenceSize: nextActiveFence,
    segment: "`".repeat(fenceSize),
  };
};

const shouldAppendPunctuationSpace = ({
  char,
  prev,
  next,
  text,
  index,
  activeFenceSize,
}) => {
  if (activeFenceSize > 0) {
    return false;
  }
  if (!ASCII_PUNCTUATION.has(char)) {
    return false;
  }
  if (char === "." && shouldSkipPeriodSpacing(text, index)) {
    return false;
  }
  if (!next || /\s/.test(next)) {
    return false;
  }
  if (
    ASCII_PUNCTUATION.has(next) ||
    ASCII_PUNCTUATION_BOUNDARY.has(next) ||
    isCjkPunctuation(next)
  ) {
    return false;
  }
  if (!isSpacingCandidate(prev) || !isSpacingCandidate(next)) {
    return false;
  }
  if (char === "." && !shouldInsertPeriodSpace(prev, next)) {
    return false;
  }
  return true;
};

export function ensureEnglishPunctuationSpacing(text) {
  if (!text) {
    return text;
  }
  let result = "";
  let activeFenceSize = 0;
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const fenceState = handleBacktickFence({
      text,
      index,
      activeFenceSize,
    });
    if (fenceState.handled) {
      result += fenceState.segment;
      activeFenceSize = fenceState.activeFenceSize;
      index = fenceState.nextIndex;
      continue;
    }
    index += 1;
    result += char;
    const prev = text[index - 2];
    const next = text[index];
    if (
      shouldAppendPunctuationSpace({
        char,
        prev,
        next,
        text,
        index: index - 1,
        activeFenceSize,
      })
    ) {
      result += " ";
    }
  }
  return result;
}
