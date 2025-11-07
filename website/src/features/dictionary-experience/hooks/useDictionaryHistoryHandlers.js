import { useCallback } from "react";
import {
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils";
import { wordCacheKey } from "@shared/api/words.js";
import { DEFAULT_MODEL } from "@core/config";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

/**
 * 意图：集中封装历史记录交互的副作用。
 * 输入：当前用户上下文、历史数据、查询执行器等。
 * 输出：handleSend/handleReoutput/handleSelectHistory/handleDeleteHistory。
 */
export function useDictionaryHistoryHandlers({
  user,
  navigate,
  text,
  setText,
  historyItems,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
  executeLookup,
  fetchWord,
  historyCaptureEnabled,
  addHistory,
  removeHistory,
  setEntry,
  setFinalText,
  setCurrentTermKey,
  setCurrentTerm,
  setActiveView,
  setLoading,
  wordStoreApi,
  applyRecord,
  cancelActiveLookup,
  resetCopyFeedback,
  currentTerm,
  activeTerm,
  showPopup,
}) {
  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        navigate("/login");
        return;
      }
      if (!text.trim()) return;

      const inputValue = text.trim();
      setText("");

      const result = await executeLookup(inputValue);
      if (result.status === "success" && historyCaptureEnabled) {
        const historyTerm = result.term ?? result.queriedTerm ?? inputValue;
        addHistory(
          historyTerm,
          user,
          result.detectedLanguage,
          result.flavor ?? dictionaryFlavor,
        );
      }
    },
    [
      user,
      navigate,
      text,
      setText,
      executeLookup,
      historyCaptureEnabled,
      addHistory,
      dictionaryFlavor,
    ],
  );

  const handleReoutput = useCallback(() => {
    if (!currentTerm) return;
    executeLookup(currentTerm, { forceNew: true });
  }, [currentTerm, executeLookup]);

  /**
   * 意图：在历史命中缓存缺失时回退至 REST 查询，并回填全局缓存。\
   * 输入：词条请求参数与缓存键。\
   * 输出：Promise<词条实体 | null>，成功时代表缓存已同步。\
   * 流程：
   *  1) 触发加载态并调用 fetchWord；
   *  2) 根据返回语言/风味重建缓存键，尝试通过 applyRecord 回填视图；
   *  3) 若回填失败则退化为直接写入 entry/finalText。\
   * 错误处理：捕获 fetchWord 抛出的异常或 error 字段并弹出全局提示。\
   * 复杂度：O(1)，依赖词典 API 的单次查询。
   */
  const hydrateHistorySelection = useCallback(
    async ({ term, language, flavor, versionId, cacheKey }) => {
      setLoading(true);
      try {
        const {
          data,
          error,
          language: requestLanguage,
          flavor: requestFlavor,
        } = (await fetchWord({
          user,
          term,
          language,
          flavor,
          model: DEFAULT_MODEL,
        })) ?? {};

        if (error) {
          showPopup(error.message ?? String(error));
          return null;
        }

        const resolvedKey = wordCacheKey({
          term,
          language: requestLanguage ?? language,
          flavor: requestFlavor ?? flavor,
          model: DEFAULT_MODEL,
        });

        if (resolvedKey !== cacheKey) {
          setCurrentTermKey(resolvedKey);
        }

        const storeState = wordStoreApi.getState();
        const record = storeState.getRecord?.(resolvedKey);
        const preferredVersionId =
          versionId ??
          record?.activeVersionId ??
          data?.id ??
          data?.versionId ??
          null;
        const hydrated = applyRecord(resolvedKey, record, preferredVersionId);
        if (hydrated) {
          setCurrentTerm(hydrated.term ?? term);
          return hydrated;
        }

        if (data) {
          setEntry(data);
          setFinalText(data.markdown ?? "");
          if (data.term) {
            setCurrentTerm(data.term);
          }
          return data;
        }

        return null;
      } catch (error) {
        showPopup(error.message ?? String(error));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      applyRecord,
      fetchWord,
      setCurrentTermKey,
      setEntry,
      setFinalText,
      setLoading,
      setCurrentTerm,
      showPopup,
      user,
      wordStoreApi,
    ],
  );

  const handleSelectHistory = useCallback(
    async (identifier, versionId) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const target =
        typeof identifier === "object" && identifier
          ? identifier
          : historyItems?.find(
              (item) => item.term === identifier || item.termKey === identifier,
            );
      const resolvedTerm =
        typeof identifier === "string" ? identifier : (target?.term ?? "");
      if (!resolvedTerm) return;
      const fallbackConfig = resolveDictionaryConfig(resolvedTerm, {
        sourceLanguage:
          (typeof identifier === "object" && identifier?.language) ||
          dictionarySourceLanguage ||
          WORD_LANGUAGE_AUTO,
        targetLanguage: dictionaryTargetLanguage,
      });
      const resolvedLanguage = target?.language ?? fallbackConfig.language;
      const resolvedFlavor =
        target?.flavor ??
        (typeof identifier === "object" && identifier?.language
          ? resolveDictionaryFlavor({
              sourceLanguage: identifier.language,
              targetLanguage: dictionaryTargetLanguage,
              resolvedSourceLanguage: fallbackConfig.language,
            })
          : dictionaryFlavor);
      const cacheKey = wordCacheKey({
        term: resolvedTerm,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
        model: DEFAULT_MODEL,
      });
      setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
      setCurrentTermKey(cacheKey);
      setCurrentTerm(resolvedTerm);
      resetCopyFeedback();
      const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);

      cancelActiveLookup();

      if (cachedRecord) {
        const applied = applyRecord(
          cacheKey,
          cachedRecord,
          versionId ?? cachedRecord.activeVersionId,
        );
        if (applied) {
          setLoading(false);
          return;
        }
      }

      await hydrateHistorySelection({
        term: resolvedTerm,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
        versionId,
        cacheKey,
      });
    },
    [
      user,
      navigate,
      historyItems,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryFlavor,
      cancelActiveLookup,
      wordStoreApi,
      applyRecord,
      executeLookup,
      hydrateHistorySelection,
      setActiveView,
      setLoading,
      setCurrentTerm,
      setCurrentTermKey,
      resetCopyFeedback,
    ],
  );

  const handleDeleteHistory = useCallback(async () => {
    if (!activeTerm) return;
    try {
      await removeHistory(activeTerm, user);
      setEntry(null);
      setFinalText("");
      setCurrentTermKey(null);
      setCurrentTerm("");
      resetCopyFeedback();
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
      showPopup(error.message ?? String(error));
    }
  }, [
    activeTerm,
    removeHistory,
    user,
    setEntry,
    setFinalText,
    setCurrentTermKey,
    setCurrentTerm,
    resetCopyFeedback,
    showPopup,
  ]);

  return {
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
  };
}
