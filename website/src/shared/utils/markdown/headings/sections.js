/**
 * 背景：
 *  - Doubao 协议常把章节标题与正文写在同一行，导致折叠组件无法提取纯标题。
 * 目的：
 *  - 将章节标题与正文拆分到独立行，保持 Markdown 结构语义化。
 * 关键决策与取舍：
 *  - 仅对受控词表命中的标题执行拆分，并复用字符索引避免语言差异导致错位。
 */
import {
  SECTION_CONTENT_WORD_PATTERN,
  SECTION_HEADING_TOKENS,
  SECTION_HEADING_TOKENS_DESC,
} from "../constants/index.js";

function normalizeHeadingIdentifier(candidate) {
  if (!candidate) {
    return "";
  }
  return candidate
    .toLowerCase()
    .replace(/[：:]/g, "")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, "");
}

function buildNormalizedIndexSegments(source) {
  let normalized = "";
  const segments = [];
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (/[^\p{L}\p{N}\u4e00-\u9fff]/u.test(char)) {
      continue;
    }
    normalized += char.toLowerCase();
    segments.push({
      normalizedLength: normalized.length,
      endIndex: index + 1,
    });
  }
  return { normalized, segments };
}

function sliceByNormalizedLength(source, segments, length) {
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index].normalizedLength >= length) {
      return source.slice(0, segments[index].endIndex);
    }
  }
  return source;
}

function shouldSplitSectionHeadingRest(rest) {
  if (!rest) {
    return false;
  }
  const trimmed = rest.trim();
  if (!trimmed) {
    return false;
  }
  const hasWordLikeContent = SECTION_CONTENT_WORD_PATTERN.test(trimmed);
  if (!hasWordLikeContent) {
    return false;
  }
  const hasStructuralCue = /[\s.:：;；、。·-]/u.test(rest);
  const hasExplicitGap = rest.length !== trimmed.length;
  return hasStructuralCue || hasExplicitGap;
}

export function isolateSectionHeadingContent(text) {
  return text.replace(
    /^(#{1,6})(\s*)([^\n]+)$/gm,
    (match, hashes, spacing, body) => {
      const trimmedBody = body.trimEnd();
      if (!trimmedBody) {
        return `${hashes}${spacing}${trimmedBody}`;
      }
      const { normalized, segments } =
        buildNormalizedIndexSegments(trimmedBody);
      if (!normalized) {
        return `${hashes}${spacing}${trimmedBody}`;
      }
      for (const token of SECTION_HEADING_TOKENS_DESC) {
        if (!normalized.startsWith(token)) {
          continue;
        }
        const headingPart = sliceByNormalizedLength(
          trimmedBody,
          segments,
          token.length,
        ).trimEnd();
        const rest = trimmedBody.slice(headingPart.length);
        if (!shouldSplitSectionHeadingRest(rest)) {
          return `${hashes}${spacing}${trimmedBody}`;
        }
        const normalizedIdentifier = normalizeHeadingIdentifier(headingPart);
        if (!SECTION_HEADING_TOKENS.has(normalizedIdentifier)) {
          return `${hashes}${spacing}${trimmedBody}`;
        }
        const trailing = rest.trimStart();
        return `${hashes} ${headingPart}\n${trailing}`;
      }
      return `${hashes}${spacing}${trimmedBody}`;
    },
  );
}
