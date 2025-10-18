/**
 * 背景：
 *  - SelectMenu 触发器曾直接写在主组件中，导致视图层过长且难以复用。
 * 目的：
 *  - 拆分触发按钮，集中处理可访问属性与占位态样式，保持主组件聚焦装配逻辑。
 * 关键决策与取舍：
 *  - 暂不支持自定义触发节点，统一通过 props 控制状态；
 *  - 保留 data- 属性方便样式与测试定位。
 * 影响范围：
 *  - SelectMenu 触发按钮的渲染与 aria 声明。
 * 演进与TODO：
 *  - TODO: 如需支持自定义触发器，可在此组件外包裹 render prop 实现。
 */
import PropTypes from "prop-types";

import styles from "../SelectMenu.module.css";

export default function SelectMenuTrigger({
  id,
  open,
  triggerRef,
  onToggle,
  onKeyDown,
  ariaLabel,
  label,
  isPlaceholder,
}) {
  return (
    <button
      type="button"
      id={id}
      className={styles["menu-trigger"]}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      data-open={open ? "true" : undefined}
      data-placeholder={isPlaceholder ? "true" : undefined}
      ref={triggerRef}
    >
      <span
        className={styles["menu-trigger-label"]}
        data-placeholder={isPlaceholder ? "true" : undefined}
      >
        {label}
      </span>
    </button>
  );
}

SelectMenuTrigger.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  triggerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isPlaceholder: PropTypes.bool.isRequired,
};

SelectMenuTrigger.defaultProps = {
  id: undefined,
};
