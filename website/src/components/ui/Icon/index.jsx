import React from "react";
import { useTheme } from "@/context";
import ICONS from "@/assets/icons.js";

export const DEFAULT_ICON_SIZE = 24;
export const DEFAULT_ICON_COLOR = "#4A4A4A";

const processSvg = (raw) =>
  raw
    .replace(/(width|height)="[^"]*"/g, "")
    .replace("<svg", '<svg width="100%" height="100%"')
    .replace(/stroke-width="[^"]*"/g, 'stroke-width="2"')
    .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
    .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');

export function ThemeIcon({
  name,
  alt,
  color = DEFAULT_ICON_COLOR,
  size = DEFAULT_ICON_SIZE,
  style,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const raw = ICONS[name]?.[theme] || ICONS[name]?.single;
  if (!raw) return null;
  const svg = processSvg(raw);
  return (
    <span
      role="img"
      aria-label={alt || name}
      style={{
        color,
        width: size,
        height: size,
        display: "inline-block",
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...props}
    />
  );
}

const defaultProps = { size: DEFAULT_ICON_SIZE, color: DEFAULT_ICON_COLOR };

export const EllipsisVerticalIcon = (props) => (
  <ThemeIcon name="ellipsis-vertical" {...defaultProps} {...props} />
);
export const StarSolidIcon = (props) => (
  <ThemeIcon name="star-solid" {...defaultProps} {...props} />
);
export const TrashIcon = (props) => (
  <ThemeIcon name="trash" {...defaultProps} {...props} />
);

export default ThemeIcon;
