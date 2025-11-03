/**
 * 背景：
 *  - 动作列表在历史实现中耦合了多种状态，导致渲染层难以维护。
 * 目的：
 *  - 通过消费 useToolbarActionsModel 输出的视图模型，专注于渲染与可访问性声明。
 * 关键决策与取舍：
 *  - 按按钮变体映射样式类，避免在渲染过程中散落条件拼接；
 *  - 仅保留动作按钮渲染，未来若新增浮层可在模型层扩展。
 * 影响范围：
 *  - OutputToolbar 动作区域。
 * 演进与TODO：
 *  - 若新增动作，需要在模型 Hook 中扩展策略表即可。
 */
import PropTypes from "prop-types";
import styles from "../OutputToolbar.module.css";
import { useToolbarActionsModel } from "../hooks/useToolbarActionsModel.js";

const resolveVariantClass = (variant) => {
  if (!variant) return "";
  return styles[`tool-button-${variant}`] || "";
};

const renderActionButton = ({ item, baseToolButtonClass }) => {
  const variantClass = resolveVariantClass(item.variant);
  const className = [baseToolButtonClass, variantClass]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      key={item.key}
      type="button"
      className={className}
      data-active={item.active ? "true" : undefined}
      onClick={item.onClick}
      aria-label={item.label}
      title={item.label}
      disabled={item.disabled}
      ref={item.anchorRef}
      onKeyDown={item.onKeyDown}
    >
      {item.icon}
    </button>
  );
};

function ToolbarActions({ baseToolButtonClass, translator, ...modelProps }) {
  const { items } = useToolbarActionsModel({
    translator,
    ...modelProps,
  });

  if (!items.length) {
    return null;
  }

  return (
    <div className={styles["action-strip"]}>
      {items.map((item) =>
        renderActionButton({
          item,
          baseToolButtonClass,
        }),
      )}
    </div>
  );
}

ToolbarActions.propTypes = {
  translator: PropTypes.shape({
    copyAction: PropTypes.string,
    copySuccess: PropTypes.string,
    deleteButton: PropTypes.string,
    deleteAction: PropTypes.string,
    report: PropTypes.string,
  }).isRequired,
  baseToolButtonClass: PropTypes.string.isRequired,
  user: PropTypes.shape({ id: PropTypes.string }),
  disabled: PropTypes.bool.isRequired,
  canCopy: PropTypes.bool,
  onCopy: PropTypes.func,
  copyFeedbackState: PropTypes.string,
  isCopySuccess: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
};

ToolbarActions.defaultProps = {
  user: null,
  canCopy: false,
  onCopy: undefined,
  copyFeedbackState: "idle",
  isCopySuccess: false,
  canDelete: false,
  onDelete: undefined,
  canReport: false,
  onReport: undefined,
};

export default ToolbarActions;
