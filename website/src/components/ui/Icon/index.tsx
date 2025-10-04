import type { CSSProperties } from "react";
import { useTheme } from "@/context";
import styles from "./ThemeIcon.module.css";
import type { ResolvedTheme } from "@/theme/mode";
import { iconSourceResolver } from "./iconSourceResolver";

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

const DEFAULT_ROLE_BY_THEME: Record<ResolvedTheme, IconRoleClass> =
  Object.freeze({
    light: "onsurface",
    dark: "onsurface",
  });

const legacyToneToRole = (
  tone: LegacyTone | undefined,
  resolvedTheme: ResolvedTheme,
): IconRoleClass => {
  /**
   * 背景：
   *  - 旧版 tone="dark" 默认假设浅色主题，仅返回 text-onsurface-strong，导致暗色主题下图标仍为深色。
   * 目的：
   *  - 统一回落到与当前主题一致的基础前景色，保证 SearchBox 等通用组件在 dark 模式下依旧可读。
   * 关键决策与取舍：
   *  - “dark” 与默认 auto 等价，均采用按主题解析的标准前景色；
   *  - “light” 保留遗留语义，仅在浅色主题下取高亮前景，在暗色主题中退回标准前景以避免反差不足。
   * 影响范围：
   *  - 所有未显式指定 roleClass 的 ThemeIcon 调用方。
   */
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
  const src = iconSourceResolver.resolve(name, resolvedTheme);
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
