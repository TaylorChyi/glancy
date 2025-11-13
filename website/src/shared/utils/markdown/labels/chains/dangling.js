import {
  DANGLING_LABEL_INLINE_CHAIN_PATTERN,
  DANGLING_LABEL_SEPARATOR_PATTERN,
  DANGLING_LABEL_SPACE_CHAIN_PATTERN,
} from "../../constants/index.js";
import {
  computeListIndentation,
  deriveLineIndentation,
} from "../../indentation.js";
import { shouldSplitInlineLabel } from "../candidates.js";

const toDanglingChainContext = (args) => {
  const [
    match = "",
    _whitespace = "",
    segment = "",
    nextLabel = "",
    offset = 0,
    source = "",
  ] = args;
  return { match, segment, nextLabel, offset, source };
};

const rewriteDanglingChainSegment = (context) => {
  const { match, segment, nextLabel, offset, source } = context;
  if (typeof nextLabel !== "string" || !shouldSplitInlineLabel(nextLabel)) {
    return match;
  }
  const indent =
    deriveLineIndentation(source, offset) ||
    computeListIndentation(source, offset) ||
    "  ";
  return `\n${indent}${segment}`;
};

const createInlineChainRewriter = (notifyMutated) => (...args) => {
  const context = toDanglingChainContext(args);
  const rewritten = rewriteDanglingChainSegment(context);
  if (rewritten !== context.match) {
    notifyMutated();
  }
  return rewritten;
};

const toSeparatorRewriteContext = (args) => {
  const [
    match = "",
    previousLine = "",
    indent = "",
    segment = "",
    nextLabel = "",
  ] = args;
  return { match, previousLine, indent, segment, nextLabel };
};

const rewriteDanglingLabelSeparator = (context) => {
  const { match, previousLine, indent, segment, nextLabel } = context;
  const hasLabeledPrefix = /\*\*([^*]+)\*\*:/u.test(previousLine);
  if (!hasLabeledPrefix) {
    return match;
  }
  if (typeof nextLabel !== "string" || !shouldSplitInlineLabel(nextLabel)) {
    return match;
  }
  const trimmedLine = previousLine.replace(/\s+$/u, "");
  return `${trimmedLine}\n${indent}${segment}`;
};

const applyInlineRewrites = (input, pattern) => {
  let current = input;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    let mutated = false;
    current = current.replace(
      pattern,
      createInlineChainRewriter(() => {
        mutated = true;
      }),
    );
    if (!mutated) {
      break;
    }
  }
  return current;
};

export function resolveDanglingLabelSeparators(text) {
  const withoutTrailingHyphen = text.replace(
    DANGLING_LABEL_SEPARATOR_PATTERN,
    (...args) =>
      rewriteDanglingLabelSeparator(toSeparatorRewriteContext(args)),
  );

  let normalized = applyInlineRewrites(
    withoutTrailingHyphen,
    DANGLING_LABEL_INLINE_CHAIN_PATTERN,
  );
  normalized = applyInlineRewrites(
    normalized,
    DANGLING_LABEL_SPACE_CHAIN_PATTERN,
  );
  return normalized;
}
