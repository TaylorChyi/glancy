import type { CSSProperties } from "react";
import { useTheme } from "@/context";
import type { ResolvedTheme } from "@/theme/mode";
import ICONS from "@/assets/icons.js";
import styles from "./ThemeIcon.module.css";

/**
 * 背景：
 *  - 旧版 Icon 依赖 light/dark 双份 SVG，并在组件中手工切换，无法复用语义色。
 * 目的：
 *  - 将 Icon 渲染与语义色系统解耦，统一以 currentColor 单源 SVG 呈现，并兼容历史 tone 属性。
 * 关键决策与取舍：
 *  - 引入 roleClass 概念映射到全局 utilities，实现语义化着色；
 *  - 使用策略函数兼容 legacy tone，避免一次性破坏既有调用方；
 *  - 保留 fallback 渲染逻辑，保障缺失资源时的信息密度与可访问性。
 * 影响范围：
 *  - 所有通过 ThemeIcon/Icon 渲染的图标、按钮与工具栏组件。
 * 演进与TODO：
 *  - 后续可扩展 loading/error 态的占位符，或支持按需加载矢量字体。
 */

const ROLE_CLASSNAME_MAP = Object.freeze({
  onsurface: "text-onsurface",
  onsurfaceStrong: "text-onsurface-strong",
  onprimary: "text-onprimary",
  muted: "text-muted",
  success: "text-onsuccess",
  warning: "text-onwarning",
  danger: "text-ondanger",
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

const legacyToneToRole = (
  tone: LegacyTone | undefined,
  resolvedTheme: ResolvedTheme,
): IconRoleClass => {
  if (tone === "dark") {
    return "onsurfaceStrong";
  }
  if (tone === "light") {
    return "onsurface";
  }
  return resolvedTheme === "dark" ? "onsurfaceStrong" : "onsurface";
};

const composeClassName = (
  base: string,
  roleClass: IconRoleClass,
  external?: string,
) => [base, ROLE_CLASSNAME_MAP[roleClass], external].filter(Boolean).join(" ");

const resolveIconSrc = (name: string) => {
  const entry = ICONS[name];
  if (!entry) {
    return undefined;
  }
  return entry.single ?? entry.light ?? entry.dark;
};

const resolveFallback = (name: string): FallbackPreset => {
  if ((FALLBACK_PRESETS as Record<string, FallbackPreset>)[name]) {
    return FALLBACK_PRESETS[name as FallbackPresetKey];
  }
  return FALLBACK_PRESETS.default;
};

const computeFallbackStyle = (
  style: CSSProperties | undefined,
  width?: number | string,
  height?: number | string,
) => {
  const sizeToken = width ?? height;
  if (sizeToken == null) {
    return style;
  }
  const resolved =
    typeof sizeToken === "number" ? `${sizeToken}px` : String(sizeToken);
  return {
    ...style,
    "--icon-fallback-size": resolved,
  } as CSSProperties;
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
  const src = resolveIconSrc(name);
  const commonClassName = composeClassName(
    "inline-block align-middle",
    iconRole,
    className,
  );
  const altText = decorative ? "" : (alt ?? name);

  if (src) {
    return (
      <img
        src={src}
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
