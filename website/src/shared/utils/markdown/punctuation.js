import { pipeline } from "../pipeline.js";
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

const WHITESPACE_PATTERN = /\s/,
  isFenceChar = (char) => char === "`",
  buildFenceSegment = (fenceSize) => "`".repeat(fenceSize),
  isFenceActive = (activeFenceSize) => activeFenceSize > 0,
  isAsciiPunctuationChar = (char) => Boolean(char && ASCII_PUNCTUATION.has(char)),
  isWhitespaceChar = (char) => Boolean(char && WHITESPACE_PATTERN.test(char)),
  hasSpacingNeighbors = (prev, next) =>
    isSpacingCandidate(prev) && isSpacingCandidate(next),
  isPeriodChar = (char) => char === ".";

function countBackticks(source, startIndex) {
  let length = 0;
  while (source[startIndex + length] === "`") {
    length += 1;
  }
  return length;
}

const computeNextFenceState = (activeFenceSize, fenceSize) =>
  activeFenceSize === 0 ? fenceSize : fenceSize >= activeFenceSize ? 0 : activeFenceSize;

function getFenceTransition({ text, index, activeFenceSize }) {
  if (!isFenceChar(text[index])) {
    return null;
  }
  const fenceSize = countBackticks(text, index);
  return {
    segment: buildFenceSegment(fenceSize),
    nextIndex: index + fenceSize,
    activeFenceSize: computeNextFenceState(activeFenceSize, fenceSize),
  };
}

const PERIOD_SKIP_CHECKS = [
  ({ prev, next }) => prev === "." || next === ".",
  ({ prev, next }) => Boolean(prev && next && isAsciiDigit(prev) && isAsciiDigit(next)),
  ({ prev, next }) =>
    Boolean(prev && next && isAsciiUppercase(prev) && isAsciiUppercase(next)),
];

const shouldSkipPeriodSpacing = (source, index) =>
  PERIOD_SKIP_CHECKS.some((check) =>
    check({ prev: source[index - 1], next: source[index + 1] }),
  );

const shouldInsertPeriodSpace = (prev, next) =>
  isSpacingCandidate(prev) && (isHanChar(next) || isAsciiUppercase(next));

const isBoundaryAdjacentChar = (char) =>
  Boolean(
    char &&
      (isAsciiPunctuationChar(char) ||
        ASCII_PUNCTUATION_BOUNDARY.has(char) ||
        isCjkPunctuation(char)),
  );

const shouldPadPeriod = ({ text, index, prev, next }) =>
  !shouldSkipPeriodSpacing(text, index) && shouldInsertPeriodSpace(prev, next);

const needsPunctuationPadding = ({ char, next }) =>
  Boolean(
    isAsciiPunctuationChar(char) &&
      next &&
      !isWhitespaceChar(next) &&
      !isBoundaryAdjacentChar(next),
  );

const shouldAppendPunctuationSpace = (context) => {
  if (isFenceActive(context.activeFenceSize)) {
    return false;
  }
  if (!needsPunctuationPadding(context)) {
    return false;
  }
  if (!hasSpacingNeighbors(context.prev, context.next)) {
    return false;
  }
  if (isPeriodChar(context.char)) {
    return shouldPadPeriod(context);
  }
  return true;
};

function appendCharWithSpacing({ text, index, activeFenceSize }) {
  const char = text[index];
  const prev = text[index - 1];
  const next = text[index + 1];
  const spacingContext = { char, prev, next, text, index, activeFenceSize };
  const padding = shouldAppendPunctuationSpace(spacingContext) ? " " : "";
  return { segment: char + padding, nextIndex: index + 1 };
}

const rewritePunctuationSpacing = (text) => {
  if (!text) {
    return text;
  }
  let result = "";
  let activeFenceSize = 0;
  for (let index = 0; index < text.length; ) {
    const fenceTransition = getFenceTransition({ text, index, activeFenceSize });
    if (fenceTransition) {
      result += fenceTransition.segment;
      activeFenceSize = fenceTransition.activeFenceSize;
      index = fenceTransition.nextIndex;
      continue;
    }
    const { segment, nextIndex } = appendCharWithSpacing({
      text,
      index,
      activeFenceSize,
    });
    result += segment;
    index = nextIndex;
  }
  return result;
};

const ensureTextInput = (text) => (typeof text === "string" ? text : "");

const applyPunctuationSpacing = (text) => rewritePunctuationSpacing(text);

const ensureEnglishPunctuationSpacingPipeline = pipeline([
  ensureTextInput,
  applyPunctuationSpacing,
]);

export function ensureEnglishPunctuationSpacing(text) {
  return ensureEnglishPunctuationSpacingPipeline(text);
}
