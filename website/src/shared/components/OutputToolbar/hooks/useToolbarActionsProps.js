/**
 * 背景：
 *  - 动作区域依赖多项状态，入口组件直接拼装 props 易导致重复与复杂度。
 * 目的：
 *  - 将动作所需属性统一 memo 化输出，便于复用。
 * 关键决策与取舍：
 *  - 保持浅比较需求，通过 useMemo 返回稳定引用；
 *  - 不在此处理业务逻辑，只负责结构化数据。
 * 影响范围：
 *  - ToolbarActions 组件。
 * 演进与TODO：
 *  - 如需新增动作字段，可在此补充。
 */
import { useMemo } from "react";

export const useToolbarActionsProps = ({
  translator,
  user,
  disabled,
  canCopy,
  onCopy,
  copyFeedbackState,
  isCopySuccess,
  favorited,
  onToggleFavorite,
  canFavorite,
  canDelete,
  onDelete,
  canReport,
  onReport,
  canShare,
  shareModel,
}) =>
  useMemo(
    () => ({
      translator,
      user,
      disabled: Boolean(disabled),
      canCopy,
      onCopy,
      copyFeedbackState,
      isCopySuccess,
      favorited,
      onToggleFavorite,
      canFavorite,
      canDelete,
      onDelete,
      canReport,
      onReport,
      canShare,
      shareModel,
    }),
    [
      translator,
      user,
      disabled,
      canCopy,
      onCopy,
      copyFeedbackState,
      isCopySuccess,
      favorited,
      onToggleFavorite,
      canFavorite,
      canDelete,
      onDelete,
      canReport,
      onReport,
      canShare,
      shareModel,
    ],
  );
