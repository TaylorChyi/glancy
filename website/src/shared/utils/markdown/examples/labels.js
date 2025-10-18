/**
 * 背景：
 *  - 判断例句与译文标签需兼容多语言与动态编号。
 * 目的：
 *  - 复用标签候选词逻辑，为示例排版提供可靠的布尔判断。
 */
import {
  EXAMPLE_LABEL_TOKENS,
  INLINE_TRANSLATION_LABEL_PATTERN,
  TRANSLATION_LABEL_BOUNDARY_PATTERN,
  TRANSLATION_LABEL_TOKENS,
} from "../constants/index.js";
import { collectInlineLabelCandidates, shouldSplitInlineLabel } from "../labels/index.js";

export function isExampleLabel(label) {
  const candidates = collectInlineLabelCandidates(label);
  if (candidates.size === 0) {
    return false;
  }
  for (const candidate of candidates) {
    if (EXAMPLE_LABEL_TOKENS.has(candidate)) {
      return true;
    }
  }
  return false;
}

export function isTranslationLabel(label) {
  const candidates = collectInlineLabelCandidates(label);
  if (candidates.size === 0) {
    return false;
  }
  for (const candidate of candidates) {
    if (TRANSLATION_LABEL_TOKENS.has(candidate)) {
      return true;
    }
  }
  return false;
}

export function findInlineTranslationLabel(value) {
  INLINE_TRANSLATION_LABEL_PATTERN.lastIndex = 0;
  while (true) {
    const match = INLINE_TRANSLATION_LABEL_PATTERN.exec(value);
    if (!match) {
      return null;
    }
    const [, rawLabel, innerLabel] = match;
    const candidate = innerLabel ?? rawLabel;
    if (!candidate) {
      continue;
    }
    if (!isTranslationLabel(candidate) && !shouldSplitInlineLabel(candidate)) {
      continue;
    }
    return { match, candidate };
  }
}

export function hasTranslationLabelPrefix(value) {
  let index = 0;
  while (index < value.length) {
    const char = value[index];
    if (!TRANSLATION_LABEL_BOUNDARY_PATTERN.test(char)) {
      break;
    }
    index += 1;
  }
  const prefix = value.slice(0, index);
  return prefix.length > 0 && isTranslationLabel(prefix);
}
