/**
 * 背景：
 *  - 动作模型需要复用的纯函数工厂以生成上下文与按钮实体。
 * 目的：
 *  - 输出可测试、与状态解耦的工厂方法，供 useToolbarActionsModel 与测试复用。
 * 关键决策与取舍：
 *  - 将纯函数抽离，确保 Hook 文件聚焦于状态组合；
 *  - 图标仍在此定义，避免在模型中散落 JSX。
 * 影响范围：
 *  - ToolbarActions 及相关测试。
 * 演进与TODO：
 *  - 后续新增动作时同步在此扩展工厂函数。
 */
import { resolveCopyIcon } from "./iconFactories";

export const buildActionContext = ({
  translator,
  user,
  canDelete,
  onDelete,
  canReport,
  onReport,
  disabled,
}) => ({
  translator,
  user,
  canDelete,
  onDelete,
  canReport,
  onReport,
  disabled,
});

export const createCopyItem = ({
  translator,
  copyFeedbackState,
  isCopySuccess,
  disabled,
  canCopy,
  onCopy,
}) => {
  const success = Boolean(isCopySuccess || copyFeedbackState === "success");
  const baseLabel = translator.copyAction || "Copy";
  const label = success ? translator.copySuccess || baseLabel : baseLabel;
  const icon = resolveCopyIcon(success);
  const copyDisabled =
    disabled || success || !canCopy || typeof onCopy !== "function";
  return {
    key: "copy",
    label,
    icon,
    onClick: onCopy,
    active: false,
    variant: "copy",
    disabled: copyDisabled,
  };
};
