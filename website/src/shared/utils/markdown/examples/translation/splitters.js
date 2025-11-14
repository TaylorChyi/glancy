import {
  assembleFollowingTranslationResult,
  extractValidTranslationContent,
  findInlineTranslationMatch,
  normalizeInlineSegments,
  sanitizeFollowingSegments,
} from "./helpers.js";

export {
  assembleFollowingTranslationResult,
  findInlineTranslationMatch,
  normalizeExampleLine,
  normalizeInlineSegments,
  parseTranslationLine,
  sanitizeTranslationSegments,
  shouldUseSanitizedSegments,
} from "./helpers.js";

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
  const translationContent = extractValidTranslationContent(upcomingLine);
  if (!translationContent) {
    return null;
  }
  const sanitizedSegments = sanitizeFollowingSegments(
    trimmedExampleBody,
    translationContent,
  );
  if (!sanitizedSegments) {
    return null;
  }
  return assembleFollowingTranslationResult(
    prefix,
    sanitizedSegments,
    upcomingLine,
    translationContent,
  );
}
