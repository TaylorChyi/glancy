/**
 * 背景：
 *  - 例句后续可能附带 `#marker#`、`[[slot]]` 等附加行，需要独立解析以复用分词逻辑。
 * 目的：
 *  - 提供附件解析工具，供 segmentation 策略复用。
 */
import { isExampleLabel } from "./labels.js";

export function parseSegmentationMarker(lines, startIndex) {
  if (startIndex >= lines.length) {
    return null;
  }
  const firstLine = lines[startIndex];
  const trimmed = firstLine.trimStart();
  if (!trimmed.startsWith("#")) {
    return null;
  }
  if (/^##/.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.replace(/\s+/g, "");
  let consumed = 1;
  if (/^#[^#\s]+#$/.test(normalized)) {
    return { marker: normalized, trailingText: "", consumed };
  }
  if (!/^#[^#\s]+$/.test(normalized)) {
    return null;
  }
  let gapConsumed = 0;
  for (let idx = startIndex + 1; idx < lines.length; idx += 1) {
    const candidate = lines[idx];
    const candidateTrimmed = candidate.trimStart();
    if (candidateTrimmed === "") {
      gapConsumed += 1;
      continue;
    }
    if (!candidateTrimmed.startsWith("#")) {
      return null;
    }
    if (/^##/.test(candidateTrimmed)) {
      return null;
    }
    const trailingText = candidateTrimmed.replace(/^#\s*/, "");
    return {
      marker: `${normalized}#`,
      trailingText,
      consumed: consumed + gapConsumed + 1,
    };
  }
  return null;
}

export function collectExampleSegmentationAttachments(lines, startIndex) {
  const markerAttachments = [];
  const preservedHeadings = [];
  let consumed = 0;
  let cursor = startIndex;
  while (cursor < lines.length) {
    const current = lines[cursor];
    const trimmed = current.trimStart();
    if (trimmed === "") {
      consumed += 1;
      cursor += 1;
      continue;
    }
    if (!/^(#|\{\{|\[\[)/.test(trimmed)) {
      break;
    }
    if (trimmed.startsWith("#")) {
      const parsed = parseSegmentationMarker(lines, cursor);
      if (!parsed) {
        preservedHeadings.push(current);
        consumed += 1;
        break;
      }
      markerAttachments.push(parsed);
      consumed += parsed.consumed;
      cursor += parsed.consumed;
      continue;
    }
    markerAttachments.push({ marker: trimmed, trailingText: "" });
    consumed += 1;
    cursor += 1;
  }
  return { markerAttachments, preservedHeadings, consumed };
}

export function shouldNormalizeExampleLine(label) {
  return isExampleLabel(label);
}
