/**
 * 背景：
 *  - 历史列表的选择、删除及发送逻辑依赖众多上下文，集中在主 Hook 中可读性差。
 * 目的：
 *  - 以责任链式的辅助 Hook 封装历史相关操作，对外暴露纯动作函数。
 * 关键决策与取舍：
 *  - 通过依赖注入传入 executeLookup 等策略，避免与查询实现产生循环依赖；
 *  - 在删除/选择等动作中统一处理状态回退，保持 UI 行为一致。
 * 影响范围：
 *  - 历史列表交互、收藏回放、登录态变更。
 * 演进与TODO：
 *  - 可在此扩展历史项埋点与批量删除能力。
 */
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
  historyCaptureEnabled,
  addHistory,
  removeHistory,
  setEntry,
  setFinalText,
  setStreamText,
  setVersions,
  setActiveVersionId,
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
        typeof identifier === "string" ? identifier : target?.term ?? "";
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
      setCurrentTermKey(cacheKey);
      const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);

      cancelActiveLookup();

      if (cachedRecord) {
        const applied = applyRecord(
          cacheKey,
          cachedRecord,
          versionId ?? cachedRecord.activeVersionId,
        );
        if (applied) {
          setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
          setLoading(false);
          setStreamText("");
          setCurrentTerm(resolvedTerm);
          return;
        }
      }

      await executeLookup(resolvedTerm, {
        versionId,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
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
      setActiveView,
      setLoading,
      setStreamText,
      setCurrentTerm,
      setCurrentTermKey,
    ],
  );

  const handleDeleteHistory = useCallback(async () => {
    if (!activeTerm) return;
    try {
      await removeHistory(activeTerm, user);
      setEntry(null);
      setFinalText("");
      setStreamText("");
      setVersions([]);
      setActiveVersionId(null);
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
    setStreamText,
    setVersions,
    setActiveVersionId,
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
