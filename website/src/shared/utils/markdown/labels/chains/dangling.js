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

const applyInlineRewrites = (input, pattern) => {
  let current = input;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    let mutated = false;
    current = current.replace(
      pattern,
      (...args) => {
        const [match, , segment, nextLabel, offset, source] = args;
        if (!shouldSplitInlineLabel(nextLabel)) {
          return match;
        }
        mutated = true;
        const indent =
          deriveLineIndentation(source, offset) ||
          computeListIndentation(source, offset) ||
          "  ";
        return `\n${indent}${segment}`;
      },
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
    (match, previousLine, indent, segment, nextLabel) => {
      const hasLabeledPrefix = /\*\*([^*]+)\*\*:/u.test(previousLine);
      if (!hasLabeledPrefix) {
        return match;
      }
      if (!shouldSplitInlineLabel(nextLabel)) {
        return match;
      }
      const trimmedLine = previousLine.replace(/\s+$/u, "");
      return `${trimmedLine}\n${indent}${segment}`;
    },
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
