/**
 * 背景：
 *  - useDictionaryExperience 过去在 Hook 内手动维护字符串累积、JSON 解析与 Markdown 归一化，
 *    streaming 过程中经常出现预览闪烁或逻辑分支漂移的问题。
 * 目的：
 *  - 以可组合的缓冲器抽象流式 Markdown 拼装，保证流式预览、最终落盘与 JSON 解析共享统一实现。
 * 关键决策与取舍：
 *  - 采用“状态 + 策略”混合设计：缓冲器内部以状态字段记录原始串与解析结果，Markdown 构建委派给策略模块
 *    （dictionaryEntryMarkdownBuilder），从而兼顾可测试性与可扩展性；
 *  - 预览更新仅在内容变化时触发，避免在高频 chunk 下造成不必要的渲染。
 * 影响范围：
 *  - useDictionaryExperience 与历史导出可共享一致的 Markdown 产物。
 * 演进与TODO：
 *  - 可进一步扩展 append 接口，支持服务端 metadata 事件（如渐进式结构化片段）。
 */

import { normalizeMarkdownEntity } from "../markdown/dictionaryMarkdownNormalizer.js";
import { buildDictionaryEntryMarkdown } from "../markdown/dictionaryEntryMarkdownBuilder.js";

const noop = () => {};

/**
 * 意图：提供统一的流式缓冲器工厂，消费原始 chunk 并派生预览/最终 Markdown。
 * 输入：可选 logger（便于测试观察）。
 * 输出：暴露 append/getSnapshot/finalize 三个操作。
 */
export function createDictionaryStreamingMarkdownBuffer({
  logger = { debug: noop },
} = {}) {
  let raw = "";
  let preview = "";
  let parsedEntry = null;
  let parsedChanged = false;

  const tryParseJson = () => {
    if (!raw || raw.trimStart()[0] !== "{") {
      return null;
    }
    try {
      const candidate = JSON.parse(raw);
      const normalized = normalizeMarkdownEntity(candidate);
      parsedChanged = parsedEntry !== normalized;
      parsedEntry = normalized;
      return parsedEntry;
    } catch (error) {
      logger.debug?.(
        "[dictionaryStreamingMarkdownBuffer] parse pending",
        error,
      );
      return null;
    }
  };

  const rebuildPreviewFromRaw = () => {
    if (!raw) {
      return "";
    }
    const entry = tryParseJson();
    if (entry) {
      return buildDictionaryEntryMarkdown(entry);
    }
    return buildDictionaryEntryMarkdown({ markdown: raw });
  };

  const appendChunk = (chunk) => {
    if (typeof chunk !== "string" || chunk.length === 0) {
      return { preview: null, entry: null };
    }
    raw += chunk;
    const nextPreview = rebuildPreviewFromRaw();
    const previewChanged = nextPreview !== preview;
    if (previewChanged) {
      preview = nextPreview;
    }
    const entryUpdated = parsedChanged ? parsedEntry : null;
    parsedChanged = false;
    return {
      preview: previewChanged ? preview : null,
      entry: entryUpdated,
    };
  };

  return Object.freeze({
    /**
     * 意图：追加 chunk 并派生最新预览。
     * 输入：chunk 字符串。
     * 输出：包含 preview（若无变化则为 null）与 entry（当解析成功且更新时返回）。
     */
    append: appendChunk,

    /**
     * 意图：将缓冲内容重置为指定 Markdown，覆盖已有原始串。
     * 输入：新 Markdown 字符串。
     * 输出：与 append 一致，返回最新预览/词条。
     */
    replace(nextMarkdown) {
      raw = "";
      preview = "";
      parsedEntry = null;
      parsedChanged = false;
      return appendChunk(nextMarkdown);
    },

    /**
     * 意图：读取当前快照，供上层直接使用。
     */
    getSnapshot() {
      return { raw, preview, entry: parsedEntry };
    },

    /**
     * 意图：在流结束时返回最终 Markdown 与解析结果。
     */
    finalize() {
      const entry = tryParseJson();
      const markdown = entry
        ? buildDictionaryEntryMarkdown(entry)
        : buildDictionaryEntryMarkdown({ markdown: raw });
      preview = markdown;
      if (entry) {
        parsedEntry = entry;
      }
      return { markdown, entry: parsedEntry };
    },
  });
}
