import {
  INLINE_TRANSLATION_LABEL_PATTERN,
  TRANSLATION_LABEL_BOUNDARY_PATTERN,
} from "../../constants/index.js";
import { isTranslationLabel } from "../labels.js";
import { stripTranslationWrappers } from "./wrappers.js";

const FOLLOWING_TRANSLATION_PATTERN =
  /^(\*\*([^*]+)\*\*|[^\s:：]{1,32})(?:\s*)([:：])(.*)$/u;
const TRAILING_WHITESPACE_PATTERN = /[ \t]+$/u;

export function findInlineTranslationMatch(rest) {
  INLINE_TRANSLATION_LABEL_PATTERN.lastIndex = 0;
  while (true) {
    const match = INLINE_TRANSLATION_LABEL_PATTERN.exec(rest);
    if (!match) {
      return null;
    }
    const [, rawLabel, innerLabel] = match;
    const candidate = innerLabel ?? rawLabel;
    if (!isTranslationLabel(candidate)) {
      continue;
    }
    return {
      match,
      startIndex: resolveInlineStart(rest, match.index),
    };
  }
}

export function normalizeExampleLine(prefix, exampleBody) {
  const composed = exampleBody ? `${prefix}${exampleBody}`.trimEnd() : prefix.trimEnd();
  return composed.replace(TRAILING_WHITESPACE_PATTERN, "");
}

export function sanitizeTranslationSegments(exampleBody, translationSegment) {
  return stripTranslationWrappers(exampleBody, translationSegment);
}

export function normalizeInlineSegments(prefix, exampleBody, translationSegment) {
  const sanitizedSegments = sanitizeTranslationSegments(
    exampleBody,
    translationSegment,
  );
  return {
    exampleLine: normalizeExampleLine(prefix, sanitizedSegments.exampleBody),
    translationSegment: sanitizedSegments.translationSegment,
  };
}

export function parseTranslationLine(translationContent) {
  const match = translationContent.match(FOLLOWING_TRANSLATION_PATTERN);
  if (!match) {
    return null;
  }
  const [, rawLabel, innerLabel] = match;
  const candidateLabel = innerLabel ?? rawLabel;
  if (!isTranslationLabel(candidateLabel)) {
    return null;
  }
  return { match, candidateLabel };
}

export function shouldUseSanitizedSegments(
  originalExampleBody,
  originalTranslationSegment,
  sanitizedSegments,
) {
  return (
    sanitizedSegments.exampleBody !== originalExampleBody ||
    sanitizedSegments.translationSegment !== originalTranslationSegment
  );
}

export function assembleFollowingTranslationResult(
  prefix,
  sanitizedSegments,
  upcomingLine,
  translationContent,
) {
  const translationIndent = upcomingLine.slice(
    0,
    upcomingLine.length - translationContent.length,
  );
  return {
    exampleLine: normalizeExampleLine(prefix, sanitizedSegments.exampleBody),
    translationLine: `${translationIndent}${sanitizedSegments.translationSegment}`.replace(
      TRAILING_WHITESPACE_PATTERN,
      "",
    ),
  };
}

export function splitInlineTranslation(prefix, rest) {
  const result = findInlineTranslationMatch(rest);
  if (!result) {
    return null;
  }
  const { startIndex } = result;
  const exampleBody = rest.slice(0, startIndex).trimEnd();
  const translationSegment = rest.slice(startIndex).trimStart();
  return normalizeInlineSegments(prefix, exampleBody, translationSegment);
}

export function splitFollowingTranslation(
  prefix,
  trimmedExampleBody,
  upcomingLine,
) {
  if (!upcomingLine) {
    return null;
  }
  const translationContent = upcomingLine.trimStart();
  const parsed = parseTranslationLine(translationContent);
  if (!parsed) {
    return null;
  }
  const sanitizedSegments = sanitizeTranslationSegments(
    trimmedExampleBody,
    translationContent,
  );
  if (
    !shouldUseSanitizedSegments(
      trimmedExampleBody,
      translationContent,
      sanitizedSegments,
    )
  ) {
    return null;
  }
  return assembleFollowingTranslationResult(
    prefix,
    sanitizedSegments,
    upcomingLine,
    translationContent,
  );
}

function resolveInlineStart(rest, startIndex) {
  let index = startIndex;
  while (index > 0) {
    const previous = rest[index - 1];
    if (!previous) {
      break;
    }
    if (TRANSLATION_LABEL_BOUNDARY_PATTERN.test(previous)) {
      index -= 1;
      continue;
    }
    break;
  }
  return index;
}
