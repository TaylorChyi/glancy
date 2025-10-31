/**
 * 背景：
 *  - useDictionaryExperience 中的视图模型构建冗长且与业务控制逻辑混杂。
 * 目的：
 *  - 将最终返回的数据结构抽离为纯函数，便于主 Hook 专注于状态编排。
 * 关键决策与取舍：
 *  - 仅依赖参数对象，确保可测试性与可复用性；
 *  - 在函数内部计算常用派生值（空状态、展示类名等）。
 * 影响范围：
 *  - DictionaryExperience Hook 的返回结果。
 * 演进与TODO：
 *  - 若后续需要分场景定制输出，可在此引入策略映射。
 */
import { buildDictionaryActionBarModel } from "./buildDictionaryActionBarModel.js";

export function createDictionaryExperienceViewModel({
  inputRef,
  t,
  text,
  setText,
  dictionarySourceLanguage,
  setDictionarySourceLanguage,
  dictionaryTargetLanguage,
  setDictionaryTargetLanguage,
  sourceLanguageOptions,
  targetLanguageOptions,
  handleSwapLanguages,
  handleSend,
  handleVoice,
  handleShowDictionary,
  handleSelectHistory,
  activeView,
  isDictionaryViewActive,
  isHistoryViewActive,
  focusInput,
  entry,
  finalText,
  streamText,
  loading,
  activeTerm,
  lang,
  handleReoutput,
  isTermActionable,
  isEntryViewActive,
  versions,
  activeVersionId,
  handleNavigateVersion,
  handleCopy,
  canCopyDefinition,
  copyFeedbackState,
  isCopySuccessActive,
  handleDeleteHistory,
  handleReport,
  popupOpen,
  popupMsg,
  closePopup,
  popupConfig,
  toastState,
  closeToast,
  reportDialog,
  reportDialogHandlers,
  dictionaryFlavor,
}) {
  const isEmptyStateActive =
    isDictionaryViewActive && !entry && !finalText && !streamText && !loading;
  const displayClassName = ["display", isEmptyStateActive ? "display-empty" : ""]
    .filter(Boolean)
    .join(" ");

  const dictionaryActionBarProps = buildDictionaryActionBarModel({
    resolvedTerm: activeTerm,
    lang,
    handleReoutput,
    isTermActionable,
    loading,
    isEntryViewActive,
    versions,
    activeVersionId,
    handleNavigateVersion,
    handleCopy,
    canCopyDefinition,
    copyFeedbackState,
    isCopySuccessActive,
    handleDeleteHistory,
    entry,
    finalText,
    handleReport,
  });

  return {
    inputRef,
    t,
    text,
    setText,
    dictionarySourceLanguage,
    setDictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionaryTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions,
    handleSwapLanguages,
    handleSend,
    handleVoice,
    handleShowDictionary,
    handleSelectHistory,
    activeView,
    viewState: {
      active: activeView,
      isDictionary: isDictionaryViewActive,
      isHistory: isHistoryViewActive,
    },
    focusInput,
    entry,
    finalText,
    streamText,
    loading,
    dictionaryActionBarProps,
    displayClassName,
    isEmptyStateActive,
    popupOpen,
    popupMsg,
    popupConfig,
    closePopup,
    toast: toastState,
    closeToast,
    handleCopy,
    reportDialog,
    reportDialogHandlers,
    canCopyDefinition,
    lang,
    dictionaryFlavor,
    dictionaryTargetLanguageLabel: t.dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel: t.dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel: t.dictionarySwapLanguages,
    searchEmptyState: {
      title: t.searchEmptyTitle,
      description: t.searchEmptyDescription,
    },
    chatInputPlaceholder: t.inputPlaceholder,
  };
}
