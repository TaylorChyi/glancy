import { pipeline } from "../../../pipeline.js";
import {
  isInlineLabelTerminator,
  shouldSplitInlineLabel,
} from "../candidates.js";

const LABEL_TOKEN_PATTERN = /[A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*/gu;
const SAFE_PREFIX_PATTERN = /[([{-–—>•·,，.。!！?？:：;；“”"'‘’]/u;

const hasSafePrefix = (source, index) => {
  if (index === 0) {
    return true;
  }
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const char = source[cursor];
    if (char === "\n") {
      return true;
    }
    if (/\s/.test(char)) {
      continue;
    }
    if (SAFE_PREFIX_PATTERN.test(char)) {
      return true;
    }
    return false;
  }
  return true;
};

const isLabelToken = (token) =>
  shouldSplitInlineLabel(token) && Boolean(token?.trim());

const shouldRemoveSeparator = ({ separator, canApply, line, end }) => {
  if (!canApply || !separator || !/^[.·]+$/.test(separator.trim())) {
    return false;
  }
  const lookahead = line
    .slice(end)
    .match(/^[.·]+([A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*)/u);
  return Boolean(lookahead && shouldSplitInlineLabel(lookahead[1]));
};

const collectSpacingInfo = (line, end) => {
  let spacingEnd = end;
  while (spacingEnd < line.length && /[ \t]/.test(line[spacingEnd])) {
    spacingEnd += 1;
  }
  return {
    spacing: line.slice(end, spacingEnd),
    nextIndex: spacingEnd,
  };
};

const isImmediateLabel = (line, nextIndex, nextMatch) => {
  if (!nextMatch) {
    return false;
  }
  if (nextMatch.index === nextIndex) {
    return true;
  }
  const bridge = line.slice(nextIndex, nextMatch.index);
  return /^[.·]+$/.test(bridge);
};

const advancePastDotLeaders = (line, cursor) => {
  let nextCursor = cursor;
  while (
    nextCursor < line.length &&
    (line[nextCursor] === "." || line[nextCursor] === "·")
  ) {
    nextCursor += 1;
  }
  return nextCursor;
};

const handleLabelContinuation = ({
  spacing,
  nextIndex,
  nextMatch,
  line,
  state,
}) => {
  const nextToken = nextMatch ? nextMatch[0] : null;
  const nextIsLabel = nextToken ? shouldSplitInlineLabel(nextToken) : false;
  state.result += ":";
  if (nextIsLabel) {
    const indent = spacing.length > 1 ? spacing.replace(/\S/g, " ") : "";
    state.result += `\n${indent}`;
    state.cursor = advancePastDotLeaders(line, nextIndex);
    state.carryLabelContext = true;
    return true;
  }
  const preservedSpacing = spacing.length > 0 ? spacing : " ";
  state.result += preservedSpacing;
  state.cursor = nextIndex;
  state.carryLabelContext = false;
  return false;
};

const rewriteLine = (line) => {
  if (!line) {
    return line;
  }

  const state = { cursor: 0, result: "", carryLabelContext: false };

  while (state.cursor < line.length) {
    LABEL_TOKEN_PATTERN.lastIndex = state.cursor;
    const match = LABEL_TOKEN_PATTERN.exec(line);
    if (!match) {
      state.result += line.slice(state.cursor);
      break;
    }

    const [token] = match;
    const start = match.index;
    const end = start + token.length;
    const separator = line.slice(state.cursor, start);
    const canApply =
      isLabelToken(token) &&
      (state.carryLabelContext || hasSafePrefix(line, start));

    if (!shouldRemoveSeparator({ separator, canApply, line, end })) {
      state.result += separator;
    }

    if (!canApply) {
      state.result += token;
      state.cursor = end;
      state.carryLabelContext = false;
      continue;
    }

    const immediateNext = line[end];
    if (immediateNext === ":" || immediateNext === "：") {
      state.result += token;
      state.cursor = end;
      state.carryLabelContext = false;
      continue;
    }

    const { spacing, nextIndex } = collectSpacingInfo(line, end);
    const nextChar = nextIndex < line.length ? line[nextIndex] : "";
    if (isInlineLabelTerminator(nextChar)) {
      state.result += token + spacing;
      state.cursor = nextIndex;
      state.carryLabelContext = false;
      continue;
    }

    LABEL_TOKEN_PATTERN.lastIndex = nextIndex;
    const nextMatch = LABEL_TOKEN_PATTERN.exec(line);
    const hasImmediateNext = isImmediateLabel(line, nextIndex, nextMatch);

    state.result += token;
    if (hasImmediateNext) {
      const continued = handleLabelContinuation({
        spacing,
        nextIndex,
        nextMatch,
        line,
        state,
      });
      if (continued) {
        continue;
      }
    } else {
      state.result += ":";
      const preservedSpacing = spacing.length > 0 ? spacing : " ";
      state.result += preservedSpacing;
      state.cursor = nextIndex;
      state.carryLabelContext = false;
    }
  }

  return state.result;
};

const ensureTextInput = (text) => (typeof text === "string" ? text : "");

const rewriteLabelLines = (text) =>
  text.replace(/(^|\n)([^\n]*)/g, (full, boundary, line) => {
    const rewritten = rewriteLine(line);
    return `${boundary}${rewritten}`;
  });

const restoreMissingLabelDelimitersPipeline = pipeline([
  ensureTextInput,
  rewriteLabelLines,
]);

export function restoreMissingLabelDelimiters(text) {
  return restoreMissingLabelDelimitersPipeline(text);
}
