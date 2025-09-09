import React, { useState } from "react";
import styles from "./GlassPanel.module.css";

/**
 * GlassPanel is a generic container that renders a blurred, translucent surface
 * with subtle interactive feedback.
 *
 * @param {Object} props - Component props.
 * @param {React.ElementType} [props.as='div'] - The underlying element to render.
 * @param {string} [props.className] - Additional class names for customization.
 * @param {React.ReactNode} props.children - Content to be displayed inside the panel.
 * @returns {JSX.Element}
 */
function GlassPanel({
  as = "div",
  className = "",
  children,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  ...rest
}) {
  const Tag = as;
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleMouseEnter = (e) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    setIsActive(false);
    onMouseLeave?.(e);
  };

  const handleMouseDown = (e) => {
    setIsActive(true);
    onMouseDown?.(e);
  };

  const handleMouseUp = (e) => {
    setIsActive(false);
    onMouseUp?.(e);
  };

  const handleTouchStart = (e) => {
    setIsActive(true);
    onTouchStart?.(e);
  };

  const handleTouchEnd = (e) => {
    setIsActive(false);
    onTouchEnd?.(e);
  };

  const classes = [
    styles.panel,
    isHovered && styles.hovered,
    isActive && styles.active,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={classes}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default GlassPanel;
