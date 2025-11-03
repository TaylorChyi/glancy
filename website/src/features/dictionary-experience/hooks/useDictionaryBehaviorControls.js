/**
 * 背景：
 *  - 查询、复制、历史等核心交互逻辑集中在同一处不利于复用。
 * 目的：
 *  - 聚合与后端交互紧密相关的控制器，输出统一的行为接口。
 * 关键决策与取舍：
 *  - 复用现有细分 Hook，避免重复实现；
 *  - 使用解构后的 state/context 以保持参数清晰。
 */
import { useDictionaryCopyController } from "./useDictionaryCopyController.js";
import { useDictionaryLookupExecutor } from "./useDictionaryLookupExecutor.js";
import { useDictionaryHistoryHandlers } from "./useDictionaryHistoryHandlers.js";
import { useDictionaryRecordHydrator } from "./useDictionaryRecordHydrator.js";

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
  const applyRecord = useDictionaryRecordHydrator({
    wordStoreApi,
    setEntry,
    setFinalText,
    setStreamText,
    setCurrentTerm,
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
    applyRecord,
    ...historyHandlers,
  };
}
