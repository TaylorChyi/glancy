import { HEADING_INLINE_LABEL_PATTERN } from "../constants/index.js";

export function createSeparateHeadingInlineLabels(shouldSplitInlineLabel) {
  return function separateHeadingInlineLabels(text) {
    return text.replace(
      HEADING_INLINE_LABEL_PATTERN,
      (match, heading, segment, label) => {
        if (!shouldSplitInlineLabel(label)) {
          return match;
        }
        const trimmedHeading = heading.replace(/\s+$/g, "");
        const normalizedSegment = segment.replace(/^\s+/, "");
        return `${trimmedHeading}\n${normalizedSegment}`;
      },
    );
  };
}
