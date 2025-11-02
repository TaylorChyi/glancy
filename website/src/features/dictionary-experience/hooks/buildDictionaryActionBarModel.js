/**
 * 背景：
 *  - 工具栏属性计算散落在主 Hook，依赖大量布尔条件，易引入回归。
 * 目的：
 *  - 以纯函数构建工具栏模型，保持输入输出明确，提高可测试性。
 * 关键决策与取舍：
 *  - 使用参数对象显式列出依赖，避免隐式耦合；
 *  - 通过组合映射保留扩展空间，未来若新增动作可在此集中调整模型。
 * 影响范围：
 *  - DictionaryExperience 工具栏组件。
 * 演进与TODO：
 *  - 可在此添加指标采集或不同布局下的属性映射策略。
 */
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
  isEntryViewActive,
  versions,
  activeVersionId,
  handleNavigateVersion,
  handleSelectVersion,
  handleCopy,
  canCopyDefinition,
  copyFeedbackState,
  isCopySuccessActive,
  favorites,
  toggleFavoriteEntry,
  handleDeleteHistory,
  entry,
  handleReport,
}) {
  return {
    term: resolvedTerm,
    lang,
    onReoutput: handleReoutput,
    disabled: !isTermActionable || loading,
    versions: isEntryViewActive ? versions : [],
    activeVersionId: isEntryViewActive ? activeVersionId : null,
    onNavigate: isEntryViewActive ? handleNavigateVersion : undefined,
    onSelectVersion: isEntryViewActive ? handleSelectVersion : undefined,
    onCopy: handleCopy,
    canCopy: canCopyDefinition,
    copyFeedbackState,
    isCopySuccess: isCopySuccessActive,
    favorited: Boolean(resolvedTerm && favorites.includes(resolvedTerm)),
    onToggleFavorite: toggleFavoriteEntry,
    canFavorite: Boolean(isTermActionable && isEntryViewActive && entry),
    canDelete: isTermActionable,
    onDelete: isEntryViewActive ? handleDeleteHistory : undefined,
    canReport: isTermActionable,
    onReport: isEntryViewActive ? handleReport : undefined,
  };
}
