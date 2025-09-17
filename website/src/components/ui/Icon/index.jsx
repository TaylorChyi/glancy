import React from "react";
import { useTheme } from "@/context";
import ICONS from "@/assets/icons.js";
import styles from "./ThemeIcon.module.css";

const FALLBACK_PRESETS = Object.freeze({
  apple: { label: "A", variant: "apple" },
  google: { label: "G", variant: "google" },
  wechat: { label: "W", variant: "wechat" },
  default: { label: "•", variant: "default" },
});

const joinClassName = (...parts) => parts.filter(Boolean).join(" ");

const resolveFallback = (name) => {
  if (FALLBACK_PRESETS[name]) {
    return FALLBACK_PRESETS[name];
  }
  return FALLBACK_PRESETS.default;
};

export function ThemeIcon({
  name,
  alt,
  className = "",
  style,
  width,
  height,
  ...rest
}) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const registryEntry = ICONS[name];
  const src = registryEntry?.[theme] || registryEntry?.single;

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={className}
        width={width}
        height={height}
        style={style}
        {...rest}
      />
    );
  }

  const { label, variant } = resolveFallback(name);
  const sizeToken = width || height;
  const fallbackStyle =
    sizeToken != null
      ? {
          ...style,
          "--icon-fallback-size":
            typeof sizeToken === "number" ? `${sizeToken}px` : sizeToken,
        }
      : style;

  return (
    <span
      role="img"
      aria-label={alt || name}
      className={joinClassName(styles.fallback, className)}
      data-variant={variant}
      style={fallbackStyle}
      {...rest}
    >
      {label}
    </span>
  );
}

export const EllipsisVerticalIcon = (props) => (
  <ThemeIcon name="ellipsis-vertical" alt="ellipsis" {...props} />
);
export const StarSolidIcon = (props) => (
  <ThemeIcon name="star-solid" alt="star" {...props} />
);
export const TrashIcon = (props) => (
  <ThemeIcon name="trash" alt="trash" {...props} />
);

export default ThemeIcon;
