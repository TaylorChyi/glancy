import PropTypes from "prop-types";

import { DETAIL_ACTION_BUTTON_CLASSNAME } from "./detailClassNames.js";

/**
 * 意图：根据禁用与 pending 状态渲染统一风格的 detail 行按钮。
 * 输入：label/pendingLabel —— 按钮展示文案；disabled/isPending —— 状态控制；onClick —— 点击行为。
 * 输出：返回规范化的按钮节点；当 label 缺失时返回 null 避免渲染空节点。
 * 流程：
 *  1) 缺省 pendingLabel 时退回 label；
 *  2) 将 disabled/isPending 归并为单一禁用态；
 *  3) 为辅助技术提供 aria-disabled 标注。
 * 错误处理：无副作用逻辑，交由上游控制。
 * 复杂度：O(1)。
 */
function DetailActionButton({
  label,
  pendingLabel,
  disabled = false,
  isPending = false,
  onClick,
}) {
  if (!label && !pendingLabel) {
    return null;
  }

  const resolvedDisabled = Boolean(disabled || isPending);
  const resolvedLabel = isPending && pendingLabel ? pendingLabel : label;

  return (
    <button
      type="button"
      className={DETAIL_ACTION_BUTTON_CLASSNAME}
      onClick={onClick}
      disabled={resolvedDisabled}
      aria-disabled={resolvedDisabled ? "true" : "false"}
    >
      {resolvedLabel}
    </button>
  );
}

DetailActionButton.propTypes = {
  label: PropTypes.string,
  pendingLabel: PropTypes.string,
  disabled: PropTypes.bool,
  isPending: PropTypes.bool,
  onClick: PropTypes.func,
};

export default DetailActionButton;
