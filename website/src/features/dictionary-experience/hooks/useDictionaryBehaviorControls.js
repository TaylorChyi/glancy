/**
 * 背景：
 *  - 查询、复制、分享、历史等核心交互逻辑集中在同一处不利于复用。
 * 目的：
 *  - 聚合与后端交互紧密相关的控制器，输出统一的行为接口。
 * 关键决策与取舍：
 *  - 复用现有细分 Hook，避免重复实现；
 *  - 使用解构后的 state/context 以保持参数清晰。
 */
import { useDictionaryVersionControls } from "./useDictionaryVersionControls.js";
import { useDictionaryCopyController } from "./useDictionaryCopyController.js";
import { useDictionaryShareController } from "./useDictionaryShareController.js";
import { useDictionaryLookupExecutor } from "./useDictionaryLookupExecutor.js";
import { useDictionaryHistoryHandlers } from "./useDictionaryHistoryHandlers.js";

export function useDictionaryBehaviorControls({
  state,
  contexts,
  wordStoreApi,
  historyCaptureEnabled,
  lookupController,
  streamWord,
  fetchWord,
}) {
  const {
    entry,
    setEntry,
    finalText,
    setFinalText,
    streamText,
    setStreamText,
    versions,
    setVersions,
    activeVersionId,
    setActiveVersionId,
    currentTermKey,
    setCurrentTermKey,
    currentTerm,
    setCurrentTerm,
    setLoading,
    setActiveView,
    text,
    setText,
  } = state;

  const {
    languageContext,
    userContext,
    historyContext,
    popup,
    languageConfig,
  } = contexts;

  const { t } = languageContext;
  const { user } = userContext;
  const { history: historyItems, addHistory, removeHistory } = historyContext;
  const { showPopup } = popup;
  const {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  } = languageConfig;
  const { beginLookup, cancelActiveLookup, clearActiveLookup, isMounted } =
    lookupController;

  const activeTerm = entry?.term || currentTerm;
  const { applyRecord, handleNavigateVersion, handleSelectVersion } =
    useDictionaryVersionControls({
      wordStoreApi,
      setEntry,
      setFinalText,
      setStreamText,
      setVersions,
      setActiveVersionId,
      setCurrentTerm,
      versions,
      activeVersionId,
      currentTermKey,
    });

  const {
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
  } = useDictionaryCopyController({
    entry,
    finalText,
    streamText,
    currentTerm,
    t,
    showPopup,
  });

  const {
    shareUrl,
    shareImageState,
    handleShareLinkCopy,
    handleShareImageExport,
  } = useDictionaryShareController({
    activeTerm,
    entry,
    finalText,
    activeVersionId,
    dictionaryTargetLanguage,
    t,
    user,
    showPopup,
  });

  const { executeLookup } = useDictionaryLookupExecutor({
    streamWord,
    user,
    beginLookup,
    clearActiveLookup,
    isMounted,
    setActiveView,
    setLoading,
    setEntry,
    setStreamText,
    setFinalText,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    currentTermKey,
    setCurrentTermKey,
    setCurrentTerm,
    wordStoreApi,
    applyRecord,
    setVersions,
    setActiveVersionId,
    resetCopyFeedback,
    showPopup,
  });

  const historyHandlers = useDictionaryHistoryHandlers({
    user,
    navigate: contexts.navigate,
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
  });

  return {
    activeTerm,
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
    shareUrl,
    shareImageState,
    handleShareLinkCopy,
    handleShareImageExport,
    handleNavigateVersion,
    handleSelectVersion,
    applyRecord,
    ...historyHandlers,
  };
}
