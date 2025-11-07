/**
 * 意图：根据上下文构建 DictionaryActionBar 所需的 props。
 * 输入：词条状态、收藏状态、复制控制器等。
 * 输出：结构化的 props 对象。
 */
export function buildDictionaryActionBarModel({
  resolvedTerm,
  lang,
  handleReoutput,
  isTermActionable,
  loading,
  handleCopy,
  canCopyDefinition,
  copyFeedbackState,
  isCopySuccessActive,
  handleDeleteHistory,
  handleReport,
}) {
  return {
    term: resolvedTerm,
    lang,
    onReoutput: handleReoutput,
    disabled: !isTermActionable || loading,
    onCopy: handleCopy,
    canCopy: canCopyDefinition,
    copyFeedbackState,
    isCopySuccess: isCopySuccessActive,
    canDelete: isTermActionable,
    onDelete: isTermActionable ? handleDeleteHistory : undefined,
    canReport: isTermActionable,
    onReport: isTermActionable ? handleReport : undefined,
  };
}
