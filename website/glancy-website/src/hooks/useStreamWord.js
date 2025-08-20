import { useApi } from "@/hooks/useApi.js";
import { detectWordLanguage, clientNameFromModel } from "@/utils";

/**
 * 提供基于 SSE 的词汇查询流式接口。
 * 对每个流片段返回文本及检测语言。
 */
export function useStreamWord() {
  const api = useApi();
  const { streamWord } = api.words;

  return async function* ({ user, term, model, signal }) {
    const language = detectWordLanguage(term);
    console.info("[useStreamWord] start", term);
    try {
      for await (const chunk of streamWord({
        userId: user.id,
        term,
        language,
        model: clientNameFromModel(model),
        token: user.token,
        signal,
      })) {
        console.info("[useStreamWord] chunk", chunk);
        yield { chunk, language };
      }
      console.info("[useStreamWord] end", term);
    } catch (error) {
      console.info("[useStreamWord] error", error);
      throw error;
    }
  };
}
