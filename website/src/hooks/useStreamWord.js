import { useApi } from "@/hooks/useApi.js";
import { detectWordLanguage, clientNameFromModel } from "@/utils";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore } from "@/store/wordStore.js";

/**
 * 提供基于 SSE 的词汇查询流式接口，并输出统一格式日志。
 * 日志格式:
 *   console.info("[streamWordWithHandling] <阶段>", { userId, term, chunk?, error? })
 * 对每个流片段返回文本及检测语言。
 */
export function useStreamWord() {
  const api = useApi();
  const { streamWord } = api.words;
  const store = useWordStore;

  return async function* streamWordWithHandling({ user, term, model, signal }) {
    const language = detectWordLanguage(term);
    const logCtx = { userId: user.id, term };
    const key = wordCacheKey({
      term,
      language,
      model: clientNameFromModel(model),
    });
    let acc = "";
    console.info("[streamWordWithHandling] start", logCtx);
    try {
      for await (const chunk of streamWord({
        userId: user.id,
        term,
        language,
        model: clientNameFromModel(model),
        token: user.token,
        signal,
        onChunk: (chunk) => {
          console.info("[streamWordWithHandling] chunk", { ...logCtx, chunk });
        },
      })) {
        acc += chunk;
        yield { chunk, language };
      }
      let entry;
      try {
        const parsed = JSON.parse(acc);
        if (parsed && typeof parsed === "object") {
          entry = parsed;
        } else {
          entry = { markdown: acc };
        }
      } catch {
        entry = { term, language, markdown: acc };
      }
      store.getState().setEntry(key, entry);
      console.info("[streamWordWithHandling] end", logCtx);
    } catch (error) {
      console.info("[streamWordWithHandling] error", { ...logCtx, error });
      throw error;
    }
  };
}
