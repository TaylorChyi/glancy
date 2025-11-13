import { pipeline } from "../../../pipeline.js";
import { isInlineLabelTerminator } from "../candidates.js";
import {
  canApplyLabelToken,
  findNextLabelToken,
  isLabelContinuation,
  shouldRemoveSeparator,
} from "./tokenMatching.js";
import { resolveContinuation } from "./continuation.js";
import { collectSpacingInfo } from "./spacing.js";

const finalizeToken = (state, parts, cursor, carryLabelContext = false) => ({
  cursor,
  carryLabelContext,
  result: state.result + parts.join(""),
});

const processApplicableToken = ({ line, state, tokenMatch, parts }) => {
  const { end } = tokenMatch;
  const immediateNext = line[end];
  if (immediateNext === ":" || immediateNext === "：") {
    return finalizeToken(state, parts, end);
  }

  const { spacing, nextIndex } = collectSpacingInfo(line, end);
  const nextChar = nextIndex < line.length ? line[nextIndex] : "";
  if (isInlineLabelTerminator(nextChar)) {
    parts.push(spacing);
    return finalizeToken(state, parts, nextIndex);
  }

  const nextToken = findNextLabelToken(line, nextIndex);
  if (isLabelContinuation({ line, nextIndex, nextToken })) {
    const continuation = resolveContinuation({
      spacing,
      nextIndex,
      nextToken,
      line,
    });
    parts.push(continuation.append);
    return finalizeToken(state, parts, continuation.cursor, continuation.carryLabelContext);
  }

  const preservedSpacing = spacing.length > 0 ? spacing : " ";
  parts.push(":", preservedSpacing);
  return finalizeToken(state, parts, nextIndex);
};

const processToken = ({ line, state, tokenMatch }) => {
  const { token, start, end } = tokenMatch;
  const separator = line.slice(state.cursor, start);
  const canApply = canApplyLabelToken({
    token,
    line,
    start,
    carryLabelContext: state.carryLabelContext,
  });
  const parts = [];

  if (!shouldRemoveSeparator({ separator, canApply, line, end })) {
    parts.push(separator);
  }

  if (!canApply) {
    parts.push(token);
    return finalizeToken(state, parts, end);
  }

  parts.push(token);
  return processApplicableToken({ line, state, tokenMatch, parts });
};

const rewriteLine = (line) => {
  if (!line) {
    return line;
  }

  let state = { cursor: 0, result: "", carryLabelContext: false };

  while (state.cursor < line.length) {
    const tokenMatch = findNextLabelToken(line, state.cursor);
    if (!tokenMatch) {
      const tail = line.slice(state.cursor);
      state = finalizeToken(state, [tail], line.length, state.carryLabelContext);
      break;
    }
    state = processToken({ line, state, tokenMatch });
  }

  return state.result;
};

const ensureTextInput = (text) => (typeof text === "string" ? text : "");

const rewriteLabelLines = (text) =>
  text.replace(/(^|\n)([^\n]*)/g, (full, boundary, segment) => {
    const rewritten = rewriteLine(segment);
    return `${boundary}${rewritten}`;
  });

const restoreMissingLabelDelimitersPipeline = pipeline([
  ensureTextInput,
  rewriteLabelLines,
]);

export function restoreMissingLabelDelimiters(text) {
  return restoreMissingLabelDelimitersPipeline(text);
}
