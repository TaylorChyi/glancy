/**
 * 背景：
 *  - 工具栏属性计算散落在主 Hook，依赖大量布尔条件，易引入回归。
 * 目的：
 *  - 以纯函数构建工具栏模型，保持输入输出明确，提高可测试性。
 * 关键决策与取舍：
 *  - 使用参数对象显式列出依赖，避免隐式耦合；
 *  - 采用组合的方式注入分享模型生成器，未来扩展无需改动主逻辑。
 * 影响范围：
 *  - DictionaryExperience 工具栏组件。
 * 演进与TODO：
 *  - 可在此添加指标采集或不同布局下的属性映射策略。
 */
import { createDictionaryShareModel } from "./dictionaryShareModel.js";

/**
 * 意图：根据上下文构建 DictionaryActionBar 所需的 props。
 * 输入：词条状态、收藏状态、复制/分享控制器等。
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
  handleCopy,
  canCopyDefinition,
  copyFeedbackState,
  isCopySuccessActive,
  handleDeleteHistory,
  shareUrl,
  handleShareLinkCopy,
  handleShareImageExport,
  shareImageState,
  entry,
  finalText,
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
    onCopy: handleCopy,
    canCopy: canCopyDefinition,
    copyFeedbackState,
    isCopySuccess: isCopySuccessActive,
    canDelete: isTermActionable,
    onDelete: isEntryViewActive ? handleDeleteHistory : undefined,
    canShare: isTermActionable,
    shareModel:
      isEntryViewActive && isTermActionable
        ? createDictionaryShareModel({
            shareUrl,
            onCopyLink: handleShareLinkCopy,
            onExportImage: handleShareImageExport,
            isImageExporting: shareImageState === "pending",
            canExportImage: Boolean(entry || finalText),
          })
        : null,
    canReport: isTermActionable,
    onReport: isEntryViewActive ? handleReport : undefined,
  };
}
