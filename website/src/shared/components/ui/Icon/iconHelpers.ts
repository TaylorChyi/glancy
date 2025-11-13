import type { CSSProperties } from "react";
import styles from "./ThemeIcon.module.css";
import type { FallbackPreset, FallbackPresetKey } from "./Icon.types";
import { composeClassName } from "./iconRoles";

const FALLBACK_PRESETS: Record<FallbackPresetKey, FallbackPreset> = Object.freeze({
  apple: { label: "A", variant: "apple" },
  google: { label: "G", variant: "google" },
  wechat: { label: "W", variant: "wechat" },
  default: { label: "•", variant: "default" },
});

const toCssDimension = (value: number | string | undefined) => {
  if (value == null) {
    return undefined;
  }
  return typeof value === "number" ? `${value}px` : String(value);
};

const mergeDimensionStyle = (
  style: CSSProperties | undefined,
  width?: number | string,
  height?: number | string,
): CSSProperties | undefined => {
  const resolvedWidth = toCssDimension(width);
  const resolvedHeight = toCssDimension(height);

  if (!resolvedWidth && !resolvedHeight) {
    return style;
  }

  return {
    ...style,
    ...(resolvedWidth ? { width: resolvedWidth } : {}),
    ...(resolvedHeight ? { height: resolvedHeight } : {}),
  } as CSSProperties;
};

export const computeFallbackStyle = (
  style: CSSProperties | undefined,
  width?: number | string,
  height?: number | string,
) => {
  const sizeToken = width ?? height;
  const mergedStyle = mergeDimensionStyle(style, width, height);
  if (sizeToken == null) {
    return mergedStyle;
  }
  const resolvedSize = toCssDimension(sizeToken);
  return {
    ...mergedStyle,
    "--icon-fallback-size": resolvedSize,
  } as CSSProperties;
};

export const computeInlineStyle = (
  style: CSSProperties | undefined,
  width?: number | string,
  height?: number | string,
) => {
  const resolvedWidth = toCssDimension(width);
  const resolvedHeight = toCssDimension(height);

  if (!resolvedWidth && !resolvedHeight) {
    return style;
  }

  return {
    ...style,
    ...(resolvedWidth ? { "--icon-inline-width": resolvedWidth } : {}),
    ...(resolvedHeight ? { "--icon-inline-height": resolvedHeight } : {}),
  } as CSSProperties;
};

export const resolveFallback = (name: string): FallbackPreset => {
  if ((FALLBACK_PRESETS as Record<string, FallbackPreset>)[name]) {
    return FALLBACK_PRESETS[name as FallbackPresetKey];
  }
  return FALLBACK_PRESETS.default;
};

export const inlineClassName = composeClassName.bind(null,
  `inline-block align-middle ${styles.inline}`,
);

export const bitmapClassName = composeClassName.bind(null,
  "inline-block align-middle",
);

export const fallbackClassName = composeClassName.bind(null, styles.fallback);
