import { useApi } from "@/hooks/useApi.js";
import {
  resolveWordLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
} from "@/utils";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore } from "@/store/wordStore.js";
import { useDataGovernanceStore } from "@/store";
import { DEFAULT_MODEL } from "@/config";

const safeParseJson = (input) => {
  if (input == null) return null;
  if (typeof input !== "string") {
    if (typeof input === "object") return input;
    return null;
  }
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

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
  const governanceStore = useDataGovernanceStore;

  /**
   * 意图：在每次流式查询前读取最新的历史采集偏好，保证客户端决策与后端参数一致。\
   * 输出：布尔值，true 表示允许保存历史。\
   * 复杂度：O(1)，直接访问 Zustand store。\
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
    const logCtx = { userId: user.id, term };
    const key = wordCacheKey({
      term,
      language: resolvedLanguage,
      flavor: resolvedFlavor,
      model,
    });
    let acc = "";
    let metadataPayload = null;
    console.info("[streamWordWithHandling] start", logCtx);
    try {
      for await (const event of streamWord({
        userId: user.id,
        term,
        language: resolvedLanguage,
        model,
        flavor: resolvedFlavor,
        token: user.token,
        signal,
        forceNew,
        versionId,
        captureHistory,
        onChunk: (chunk) => {
          console.info("[streamWordWithHandling] chunk", { ...logCtx, chunk });
        },
      })) {
        if (event?.type === "metadata") {
          metadataPayload = event.data;
          continue;
        }
        const chunk = event?.data ?? "";
        acc += chunk;
        yield { chunk, language: resolvedLanguage };
      }
      const parsedEntry = safeParseJson(acc);
      const metadata = safeParseJson(metadataPayload);
      const entryBase =
        parsedEntry && typeof parsedEntry === "object"
          ? parsedEntry
          : { term, language: resolvedLanguage, markdown: acc };
      const entryFlavor =
        entryBase.flavor ?? metadata?.flavor ?? resolvedFlavor;
      const entry = { ...entryBase, flavor: entryFlavor };
      const versionsSource =
        (metadata && Array.isArray(metadata.versions) && metadata.versions) ||
        (parsedEntry &&
          Array.isArray(parsedEntry.versions) &&
          parsedEntry.versions);
      const derivedVersions =
        versionsSource && versionsSource.length > 0 ? versionsSource : [entry];
      const activeVersionId =
        metadata?.activeVersionId ??
        parsedEntry?.activeVersionId ??
        entry.id ??
        entry.versionId;
      const metadataBase =
        metadata && typeof metadata === "object"
          ? Object.fromEntries(
              Object.entries(metadata).filter(
                ([key]) => key !== "versions" && key !== "activeVersionId",
              ),
            )
          : {};
      const metaPayload = {
        ...metadataBase,
        ...(parsedEntry?.metadata ?? {}),
        flavor: entryFlavor,
      };
      const entryId = entry.id ?? entry.versionId;
      const applyFlavor = (version) => ({
        ...version,
        flavor: version.flavor ?? entryFlavor,
      });
      const mergedVersions = derivedVersions.some(
        (version) =>
          String(version.id ?? version.versionId) === String(entryId) ||
          version === entry,
      )
        ? derivedVersions.map((version) => {
            const versionId = version.id ?? version.versionId;
            if (entryId && String(versionId) === String(entryId)) {
              return applyFlavor({ ...version, ...entry });
            }
            return applyFlavor(version);
          })
        : [...derivedVersions.map(applyFlavor), entry];
      store.getState().setVersions(key, mergedVersions, {
        activeVersionId,
        metadata: metaPayload,
      });
      console.info("[streamWordWithHandling] end", logCtx);
    } catch (error) {
      console.info("[streamWordWithHandling] error", { ...logCtx, error });
      throw error;
    }
  };
}
