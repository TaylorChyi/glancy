import { shouldSplitInlineLabel } from "../candidates.js";

const LABEL_TOKEN_PATTERN = /[A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*/gu;
const SAFE_PREFIX_PATTERN = /[([{-–—>•·,，.。!！?？:：;；“”"'‘’]/u;
const DOT_LEADER_PATTERN = /^[.·]+$/;

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

export const isDotLeaderSequence = (value) => DOT_LEADER_PATTERN.test(value);

export const isLabelToken = (token) =>
  shouldSplitInlineLabel(token) && Boolean(token?.trim());

export const findNextLabelToken = (line, cursor) => {
  LABEL_TOKEN_PATTERN.lastIndex = cursor;
  const match = LABEL_TOKEN_PATTERN.exec(line);
  if (!match) {
    return null;
  }
  const [token] = match;
  const start = match.index;
  return {
    token,
    start,
    end: start + token.length,
  };
};

export const canApplyLabelToken = ({
  token,
  line,
  start,
  carryLabelContext,
}) =>
  isLabelToken(token) && (carryLabelContext || hasSafePrefix(line, start));

export const shouldRemoveSeparator = ({ separator, canApply, line, end }) => {
  if (!canApply || !separator || !isDotLeaderSequence(separator.trim())) {
    return false;
  }
  const lookahead = line
    .slice(end)
    .match(/^[.·]+([A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*)/u);
  return Boolean(lookahead && shouldSplitInlineLabel(lookahead[1]));
};

export const isLabelContinuation = ({ line, nextIndex, nextToken }) => {
  if (!nextToken) {
    return false;
  }
  if (nextToken.start === nextIndex) {
    return true;
  }
  const bridge = line.slice(nextIndex, nextToken.start);
  return isDotLeaderSequence(bridge);
};
