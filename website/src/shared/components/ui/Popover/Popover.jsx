/**
 * 背景：
 *  - 语言切换等场景需要浮层在不同视窗高度下自如翻转，现有实现仅支持单一方向。
 * 目的：
 *  - 在 Popover 内部提供可扩展的定位策略，便于统一管理候选方向与间距计算。
 * 关键决策与取舍：
 *  - 采用策略映射（Strategy Pattern）封装不同方向的计算，避免调用方各自判断；
 *  - 定位副作用抽离到 usePopoverPositioning，保持组件专注渲染。
 * 影响范围：
 *  - 所有 Popover 调用方；新增 data-placement 便于调试与测试验证。
 * 演进与TODO：
 *  - 后续可扩展更多策略（如自动宽度自适应）并开放配置化入口。
 */
import { createPortal } from "react-dom";
import styles from "./Popover.module.css";
import usePopoverPositioning from "./usePopoverPositioning";

function Popover({
  anchorRef,
  isOpen,
  children,
  onClose,
  placement = "bottom",
  align = "start",
  offset = 8,
  fallbackPlacements = [],
  className,
  style,
}) {
  const { setContentNode, position, visible, activePlacement } =
    usePopoverPositioning({
      anchorRef,
      isOpen,
      placement,
      fallbackPlacements,
      align,
      offset,
      onClose,
    });

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const classNames = [styles.popover, className].filter(Boolean).join(" ");
  const inlineStyles = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    ...style,
  };

  return createPortal(
    <div
      ref={setContentNode}
      className={classNames}
      data-visible={visible}
      data-placement={activePlacement}
      style={inlineStyles}
    >
      {children}
    </div>,
    document.body,
  );
}

export default Popover;
