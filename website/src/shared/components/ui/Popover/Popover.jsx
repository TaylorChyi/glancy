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
