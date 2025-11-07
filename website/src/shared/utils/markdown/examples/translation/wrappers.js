import { TRANSLATION_WRAPPER_PAIRS } from "../../constants/index.js";
import { isLikelyStandaloneTranslation } from "../../characters.js";

export function stripTranslationWrappers(exampleBody, translationSegment) {
  if (!exampleBody) {
    return { exampleBody, translationSegment };
  }
  const trimmedExample = exampleBody.trimEnd();
  for (const [open, close] of TRANSLATION_WRAPPER_PAIRS) {
    if (!trimmedExample.endsWith(open)) {
      continue;
    }
    const withoutOpen = trimmedExample
      .slice(0, trimmedExample.length - open.length)
      .trimEnd();
    let trimmedTranslation = translationSegment.trimEnd();
    if (trimmedTranslation.endsWith(close)) {
      trimmedTranslation = trimmedTranslation.slice(0, -close.length).trimEnd();
    }
    return { exampleBody: withoutOpen, translationSegment: trimmedTranslation };
  }
  return { exampleBody, translationSegment };
}

export function extractParentheticalTranslation(rawExample) {
  if (!rawExample) {
    return null;
  }
  const trimmed = rawExample.trimEnd();
  for (const [open, close] of TRANSLATION_WRAPPER_PAIRS) {
    if (!trimmed.endsWith(close)) {
      continue;
    }
    const start = trimmed.lastIndexOf(open);
    if (start === -1) {
      continue;
    }
    const candidate = trimmed
      .slice(start + open.length, trimmed.length - close.length)
      .trim();
    if (!isLikelyStandaloneTranslation(candidate)) {
      continue;
    }
    const exampleBody = trimmed.slice(0, start).trimEnd();
    return { exampleBody, translation: candidate };
  }
  return null;
}
