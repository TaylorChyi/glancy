import styles from "./Popover.module.css";

export function getPopoverClassName(customClassName) {
  return [styles.popover, customClassName].filter(Boolean).join(" ");
}

export function getPopoverInlineStyles(position, customInlineStyles = {}) {
  if (!position) {
    return { ...customInlineStyles };
  }

  return {
    top: `${position.top}px`,
    left: `${position.left}px`,
    ...customInlineStyles,
  };
}
