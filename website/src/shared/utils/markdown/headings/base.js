import {
  BROKEN_HEADING_LINE_PATTERN,
  HEADING_STUCK_TO_PREVIOUS,
  HEADING_WITHOUT_PADDING,
  HEADING_WITHOUT_SPACE,
} from "../constants/index.js";

function isListMarkerCandidate(segment) {
  const trimmed = segment.trimStart();
  if (!trimmed) {
    return false;
  }
  if (/^[-*+][ \t]+/.test(trimmed)) {
    return true;
  }
  if (/^\d+[.)][ \t]+/.test(trimmed)) {
    return true;
  }
  return false;
}

export function ensureHeadingSpacing(text) {
  return text.replace(
    HEADING_WITHOUT_SPACE,
    (_, hashes, rest) => `${hashes} ${rest}`,
  );
}

export function ensureHeadingPadding(text) {
  return text.replace(
    HEADING_WITHOUT_PADDING,
    (_, before, heading) => `${before}\n\n${heading}`,
  );
}

export function ensureHeadingLineBreak(text) {
  return text.replace(
    HEADING_STUCK_TO_PREVIOUS,
    (match, before, hashes, offset, source) => {
      const hashIndex = offset + before.length;
      if (hashes.length === 1) {
        const lineStart = source.lastIndexOf("\n", hashIndex - 1) + 1;
        const lineBefore = source.slice(lineStart, hashIndex);
        const hasHeadingCue = /[:：)）】]/u.test(lineBefore);
        if (!hasHeadingCue) {
          return match;
        }
      }
      return `${before}\n${hashes}`;
    },
  );
}

export function mergeBrokenHeadingLines(text) {
  return text.replace(
    BROKEN_HEADING_LINE_PATTERN,
    (match, hashes, _indent, body) => {
      if (!body) {
        return match;
      }
      const normalizedBody = body.trim();
      if (!normalizedBody) {
        return match;
      }
      if (normalizedBody.startsWith("#")) {
        return match;
      }
      if (isListMarkerCandidate(normalizedBody)) {
        return match;
      }
      return `${hashes} ${normalizedBody}`;
    },
  );
}
