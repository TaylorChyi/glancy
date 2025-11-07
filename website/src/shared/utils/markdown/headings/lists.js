import {
  HEADING_ATTACHED_LIST_PATTERN,
  HEADING_LIST_TITLES,
  LIST_MARKER_WITHOUT_GAP,
} from "../constants/index.js";

function normalizeHeadingTitle(title) {
  return title.replace(/[\s：:]+/g, "");
}

function shouldSeparateHeadingList(headingTitle, rest) {
  if (!rest || !/[:：]/.test(rest)) {
    return false;
  }
  const normalized = normalizeHeadingTitle(headingTitle);
  if (!normalized) {
    return false;
  }
  return HEADING_LIST_TITLES.has(normalized);
}

export function separateHeadingListMarkers(text) {
  return text.replace(
    HEADING_ATTACHED_LIST_PATTERN,
    (match, prefix, headingBody, _dash, rest) => {
      const headingTitle = headingBody.trimEnd();
      if (!shouldSeparateHeadingList(headingTitle, rest)) {
        return match;
      }
      const normalizedHeading = `${prefix}${headingTitle}`.trimEnd();
      const listContent = rest.replace(/^\s*/, "");
      const bullet = listContent.startsWith("-")
        ? listContent
        : `- ${listContent}`;
      return `${normalizedHeading}\n${bullet}`;
    },
  );
}

export function ensureListSpacing(text) {
  return text.replace(
    LIST_MARKER_WITHOUT_GAP,
    (_, marker, rest) => `${marker} ${rest}`,
  );
}
