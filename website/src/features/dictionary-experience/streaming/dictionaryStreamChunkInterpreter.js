import { normalizeMarkdownEntity } from "../markdown/dictionaryMarkdownNormalizer.js";

const noopLogger = Object.freeze({ debug: () => {} });

const isObject = (value) => value !== null && typeof value === "object";

const safeJsonParse = (candidate, debug) => {
  if (typeof candidate !== "string") {
    return null;
  }
  const trimmed = candidate.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    debug?.("[dictionaryStreamChunkInterpreter] JSON.parse failed", error);
    return null;
  }
};

const extractOpenAiDelta = (payload) => {
  if (!isObject(payload)) {
    return null;
  }
  const [firstChoice] = Array.isArray(payload.choices) ? payload.choices : [];
  const delta = firstChoice?.delta;
  if (!delta) {
    return null;
  }
  if (typeof delta.content === "string") {
    return delta.content;
  }
  if (Array.isArray(delta.content)) {
    const merged = delta.content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("");
    return merged || null;
  }
  return null;
};

const OPERATION_APPEND = "append";
const OPERATION_REPLACE = "replace";

const STRATEGIES = [
  {
    matches: (chunk) => isObject(chunk) && typeof chunk.markdown === "string",
    interpret: (chunk) => {
      const normalizedEntry = normalizeMarkdownEntity(chunk);
      return {
        text: normalizedEntry.markdown ?? "",
        entry: normalizedEntry,
        operation: OPERATION_REPLACE,
      };
    },
  },
  {
    matches: (chunk) => isObject(chunk) && typeof chunk.value === "string",
    interpret: (chunk) => ({
      text: chunk.value,
      entry: null,
      operation: OPERATION_APPEND,
    }),
  },
  {
    matches: (chunk) => typeof chunk === "string",
    interpret: (chunk, { debug }) => {
      const parsed = safeJsonParse(chunk, debug);
      if (parsed) {
        if (typeof parsed.markdown === "string") {
          const normalizedEntry = normalizeMarkdownEntity(parsed);
          return {
            text: normalizedEntry.markdown ?? "",
            entry: normalizedEntry,
            operation: OPERATION_REPLACE,
          };
        }
        const openAiDelta = extractOpenAiDelta(parsed);
        if (typeof openAiDelta === "string" && openAiDelta.length > 0) {
          return {
            text: openAiDelta,
            entry: null,
            operation: OPERATION_APPEND,
          };
        }
        if (typeof parsed.value === "string") {
          return {
            text: parsed.value,
            entry: null,
            operation: OPERATION_APPEND,
          };
        }
      }
      return { text: chunk, entry: null, operation: OPERATION_APPEND };
    },
  },
];

STRATEGIES.push({
  matches: (chunk) => typeof chunk === "number" || typeof chunk === "boolean",
  interpret: (chunk) => ({
    text: String(chunk),
    entry: null,
    operation: OPERATION_APPEND,
  }),
});

/**
 * 意图：对流式 chunk 执行解释，返回可供缓冲器消费的 Markdown 片段与词条实体。
 * 输入：chunk 原始载荷与可选 logger。
 * 输出：{ text, entry }，其中 text 恒为字符串，entry 为归一化词条或 null。
 * 复杂度：O(k)，k 为命中策略前遍历的策略数量，默认较小。
 */
export function createDictionaryStreamChunkInterpreter({ logger } = {}) {
  const resolvedLogger = logger ?? noopLogger;
  return {
    interpret(rawChunk) {
      if (rawChunk == null) {
        return { text: "", entry: null, operation: OPERATION_APPEND };
      }
      for (const strategy of STRATEGIES) {
        if (strategy.matches(rawChunk)) {
          return strategy.interpret(rawChunk, resolvedLogger);
        }
      }
      resolvedLogger.debug?.(
        "[dictionaryStreamChunkInterpreter] fallback chunk",
        rawChunk,
      );
      return {
        text: String(rawChunk),
        entry: null,
        operation: OPERATION_APPEND,
      };
    },
  };
}

export const __INTERNAL__ = Object.freeze({
  STRATEGIES,
  safeJsonParse,
  extractOpenAiDelta,
  OPERATION_APPEND,
  OPERATION_REPLACE,
});
