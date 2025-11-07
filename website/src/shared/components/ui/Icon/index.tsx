import type { CSSProperties } from "react";
import { useTheme } from "@core/context";
import styles from "./ThemeIcon.module.css";
import type { ResolvedTheme } from "@shared/theme/mode";
import { iconSourceResolver } from "./iconSourceResolver";
import type { IconVariantResource } from "./iconSourceResolver";



const ROLE_CLASSNAME_MAP = Object.freeze({
  onsurface: "text-onsurface",
  onsurfaceStrong: "text-onsurface-strong",
  onprimary: "text-onprimary",
  muted: "text-muted",
  success: "text-onsuccess",
  warning: "text-onwarning",
  danger: "text-ondanger",
  
  inherit: "",
});

type IconRoleClass = keyof typeof ROLE_CLASSNAME_MAP;

type LegacyTone = "auto" | "light" | "dark";

type BaseIconProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  roleClass?: IconRoleClass;
  decorative?: boolean;
  title?: string;
};

type LegacyCompatibleIconProps = BaseIconProps & {
  alt?: string;
  tone?: LegacyTone;
};

type IconProps = LegacyCompatibleIconProps;

type FallbackPresetKey = "apple" | "google" | "wechat" | "default";

type FallbackPreset = {
  label: string;
  variant: FallbackPresetKey;
};

const FALLBACK_PRESETS: Record<FallbackPresetKey, FallbackPreset> =
  Object.freeze({
    apple: { label: "A", variant: "apple" },
    google: { label: "G", variant: "google" },
    wechat: { label: "W", variant: "wechat" },
    default: { label: "•", variant: "default" },
  });

const DEFAULT_ROLE_BY_THEME: Record<ResolvedTheme, IconRoleClass> =
  Object.freeze({
    light: "onsurface",
    dark: "onsurface",
  });

const legacyToneToRole = (
  tone: LegacyTone | undefined,
  resolvedTheme: ResolvedTheme,
): IconRoleClass => {
  
  if (tone === "light") {
    return resolvedTheme === "light" ? "onsurfaceStrong" : "onsurface";
  }
  return DEFAULT_ROLE_BY_THEME[resolvedTheme] ?? "onsurface";
};

const composeClassName = (
  base: string,
  roleClass: IconRoleClass,
  external?: string,
) => [base, ROLE_CLASSNAME_MAP[roleClass], external].filter(Boolean).join(" ");

const resolveFallback = (name: string): FallbackPreset => {
  if ((FALLBACK_PRESETS as Record<string, FallbackPreset>)[name]) {
    return FALLBACK_PRESETS[name as FallbackPresetKey];
  }
  return FALLBACK_PRESETS.default;
};

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

const computeFallbackStyle = (
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

const computeInlineStyle = (
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

const pickRenderableAsset = (variant: IconVariantResource | null) => {
  if (!variant) {
    return { inline: null, url: null };
  }
  const inline =
    variant.inline && variant.inline.length > 0 ? variant.inline : null;
  const url = variant.url && variant.url.length > 0 ? variant.url : null;
  return { inline, url };
};

export function ThemeIcon({
  name,
  alt,
  className = "",
  style,
  width,
  height,
  tone = "auto",
  roleClass,
  decorative = false,
  title,
}: IconProps) {
  const { resolvedTheme } = useTheme();
  const iconRole = roleClass ?? legacyToneToRole(tone, resolvedTheme);
  const resolvedVariant = iconSourceResolver.resolve(name, resolvedTheme);
  const { inline, url } = pickRenderableAsset(resolvedVariant);
  const commonClassName = composeClassName(
    "inline-block align-middle",
    iconRole,
    className,
  );
  const altText = decorative ? "" : (alt ?? name);

  if (inline) {
    return (
      <span
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : altText}
        className={composeClassName(
          `inline-block align-middle ${styles.inline}`,
          iconRole,
          className,
        )}
        style={computeInlineStyle(style, width, height)}
        aria-hidden={decorative || undefined}
        title={title}
        dangerouslySetInnerHTML={{ __html: inline }}
      />
    );
  }

  if (url) {
    return (
      <img
        src={url}
        alt={altText}
        className={commonClassName}
        width={width}
        height={height}
        style={style}
        aria-hidden={decorative || undefined}
        title={title}
        loading="lazy"
      />
    );
  }

  const fallback = resolveFallback(name as FallbackPresetKey);
  return (
    <span
      role="img"
      aria-label={altText}
      className={composeClassName(styles.fallback, iconRole, className)}
      data-variant={fallback.variant}
      style={computeFallbackStyle(style, width, height)}
      aria-hidden={decorative || undefined}
      title={title}
    >
      {fallback.label}
    </span>
  );
}

export const EllipsisVerticalIcon = (props: IconProps) => (
  <ThemeIcon name="ellipsis-vertical" alt="ellipsis" {...props} />
);

export const StarSolidIcon = (props: IconProps) => (
  <ThemeIcon name="star-solid" alt="star" {...props} />
);

export const TrashIcon = (props: IconProps) => (
  <ThemeIcon name="trash" alt="trash" {...props} />
);

export default ThemeIcon;
