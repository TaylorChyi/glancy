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
