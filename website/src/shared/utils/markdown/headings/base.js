/**
 * 背景：
 *  - Doubao 的 Markdown 标题常见空格缺失、误与正文黏连、换行异常等问题。
 * 目的：
 *  - 提供基础的标题间距与断行修复策略，为后续结构化处理（标签拆分、章节折叠）打下基线。
 * 关键决策与取舍：
 *  - 通过正则识别常见异常模式，保持纯函数设计以便组合；
 *  - 在合并拆分逻辑时加入保守判断，避免误改合法 markdown。
 */
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
