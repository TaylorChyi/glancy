import { useApi } from "@/hooks/useApi.js";
import {
  resolveWordLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
} from "@/utils";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore } from "@/store/wordStore.js";
// 直接引用治理 store，避免桶状导出拆分 chunk 后的执行先后错位。
import { useDataGovernanceStore } from "@/store/dataGovernanceStore.ts";
import { DEFAULT_MODEL } from "@/config";
import { StreamWordSession } from "@/features/dictionary-experience/streaming/streamWordSession.js";

/**
 * 提供基于 SSE 的词汇查询流式接口，并输出统一格式日志。
 * 日志由 StreamWordSession 统一输出，保证所有调用点具备一致的可观测性。
 * 对每个流片段返回文本及检测语言。
 */
export function useStreamWord() {
  const api = useApi();
  const { streamWord } = api.words;
  const store = useWordStore;
  const governanceStore = useDataGovernanceStore;

  /**
   * 意图：在每次流式查询前读取最新的历史采集偏好，保证客户端决策与后端参数一致。
   * 输出：布尔值，true 表示允许保存历史。
   * 复杂度：O(1)，直接访问 Zustand store。
   */
  const readCaptureHistoryPreference = () =>
    Boolean(governanceStore.getState().historyCaptureEnabled);

  return async function* streamWordWithHandling({
    user,
    term,
    signal,
    forceNew = false,
    versionId,
    language = WORD_LANGUAGE_AUTO,
    flavor = WORD_FLAVOR_BILINGUAL,
  }) {
    const captureHistory = readCaptureHistoryPreference();
    const resolvedLanguage = resolveWordLanguage(term, language);
    const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;
    const model = DEFAULT_MODEL;
    const cacheKey = wordCacheKey({
      term,
      language: resolvedLanguage,
      flavor: resolvedFlavor,
      model,
    });

    // 关键步骤：将流式细节收敛到 StreamWordSession，替代方案是保留旧有的内联解析逻辑，但那会让 Hook 与领域逻辑强耦合。
    const session = new StreamWordSession({
      request: {
        userId: user.id,
        token: user.token,
        term,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
        signal,
        forceNew,
        versionId,
        captureHistory,
        model,
        key: cacheKey,
      },
      dependencies: {
        streamWordApi: streamWord,
      },
    });

    const iterator = session.stream();
    for await (const payload of iterator) {
      yield payload;
    }
    const { key, versions, options } = session.getStorePayload();
    store.getState().setVersions(key, versions, options);
  };
}
