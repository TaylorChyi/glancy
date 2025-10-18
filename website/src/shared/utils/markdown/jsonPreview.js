/**
 * 背景：
 *  - Doubao 的流式响应可能先返回 JSON 片段，再逐步补全 markdown 字段。
 * 目的：
 *  - 提供容错的预览提取器，兼容纯 Markdown、完整 JSON、以及尚未闭合的 JSON 流。
 * 关键决策与取舍：
 *  - 仅依赖字符串扫描避免引入 JSON.parse，确保在不完整流时也能返回已有片段；
 *  - 将换行归一化逻辑与 JSON 解析解耦，便于在其它模块复用。
 * 影响范围：
 *  - Chat/词典 streaming 预览；polishDictionaryMarkdown 的前置输入处理。
 * 演进与TODO：
 *  - 若后续协议调整字段命名，可在 MARKDOWN_KEY 与 findMarkdownValue 中更新匹配策略。
 */
import { NEWLINE_NORMALIZER } from "./constants/index.js";
import { decodeJsonString } from "./jsonStringParser.js";
import { findMarkdownValue } from "./markdownJsonScanner.js";

export function normalizeNewlines(text) {
  return text.replace(NEWLINE_NORMALIZER, "\n");
}

function isLikelyJson(text) {
  if (!text) return false;
  const first = text.trimStart()[0];
  return first === "{" || first === "[";
}

export function extractMarkdownPreview(buffer) {
  if (!buffer) return "";
  if (!isLikelyJson(buffer)) {
    return normalizeNewlines(buffer);
  }
  const trimmed = buffer.trimStart();
  const value = findMarkdownValue(trimmed);
  if (!value) return null;
  if (!value.raw) return "";
  return decodeJsonString(value.raw);
}
