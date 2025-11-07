import {
  INLINE_TRANSLATION_LABEL_PATTERN,
  TRANSLATION_LABEL_BOUNDARY_PATTERN,
} from "../../constants/index.js";
import { isTranslationLabel } from "../labels.js";
import { stripTranslationWrappers } from "./wrappers.js";

export function splitInlineTranslation(prefix, rest) {
  INLINE_TRANSLATION_LABEL_PATTERN.lastIndex = 0;
  while (true) {
    const translationMatch = INLINE_TRANSLATION_LABEL_PATTERN.exec(rest);
    if (!translationMatch) {
      break;
    }
    const [, rawLabel, innerLabel] = translationMatch;
    const candidate = innerLabel ?? rawLabel;
    if (!isTranslationLabel(candidate)) {
      continue;
    }
    let start = translationMatch.index;
    while (start > 0) {
      const previous = rest[start - 1];
      if (!previous) {
        break;
      }
      if (TRANSLATION_LABEL_BOUNDARY_PATTERN.test(previous)) {
        start -= 1;
        continue;
      }
      break;
    }
    let exampleBody = rest.slice(0, start).trimEnd();
    let translationSegment = rest.slice(start).trimStart();
    const sanitizedSegments = stripTranslationWrappers(
      exampleBody,
      translationSegment,
    );
    exampleBody = sanitizedSegments.exampleBody;
    translationSegment = sanitizedSegments.translationSegment;
    const exampleLine = exampleBody
      ? `${prefix}${exampleBody}`.trimEnd()
      : prefix.trimEnd();
    return {
      exampleLine: exampleLine.replace(/[ \t]+$/u, ""),
      translationSegment,
    };
  }
  return null;
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
  const translationMatch = translationContent.match(
    /^(\*\*([^*]+)\*\*|[^\s:：]{1,32})(?:\s*)([:：])(.*)$/u,
  );
  if (!translationMatch) {
    return null;
  }
  const [, rawLabel, innerLabel] = translationMatch;
  const candidateLabel = innerLabel ?? rawLabel;
  if (!isTranslationLabel(candidateLabel)) {
    return null;
  }
  const sanitizedSegments = stripTranslationWrappers(
    trimmedExampleBody,
    translationContent,
  );
  const changedExample = sanitizedSegments.exampleBody !== trimmedExampleBody;
  const changedTranslation =
    sanitizedSegments.translationSegment !== translationContent;
  if (!changedExample && !changedTranslation) {
    return null;
  }
  const normalizedExample = sanitizedSegments.exampleBody
    ? `${prefix}${sanitizedSegments.exampleBody}`.trimEnd()
    : prefix.trimEnd();
  const translationIndent = upcomingLine.slice(
    0,
    upcomingLine.length - translationContent.length,
  );
  return {
    exampleLine: normalizedExample.replace(/[ \t]+$/u, ""),
    translationLine:
      `${translationIndent}${sanitizedSegments.translationSegment}`.replace(
        /[ \t]+$/u,
        "",
      ),
  };
}
