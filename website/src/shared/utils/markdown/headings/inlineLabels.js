/**
 * 背景：
 *  - 标题与首个行内标签相连时会破坏折叠逻辑，需要先把标签拆到独立行。
 * 目的：
 *  - 暴露工厂方法，允许调用方注入 `shouldSplitInlineLabel` 以避免循环依赖。
 */
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
