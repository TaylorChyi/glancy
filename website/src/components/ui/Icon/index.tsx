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

type IconVariantKey = "single" | "light" | "dark";

type IconAssetPayload = {
  src?: string;
  content?: string;
};

type IconRegistry = Record<
  string,
  Partial<Record<IconVariantKey, IconAssetPayload>>
>;

const ICON_VARIANT_PRIORITY: readonly IconVariantKey[] = [
  "single",
  "light",
  "dark",
];

const registry = ICONS as IconRegistry;

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

/**
 * 意图：统一包装元素的尺寸与配色策略，避免内联 SVG 因属性缺失而退化为黑色。
 * 输入：可选的 style、width、height；width/height 支持 number 或 string。
 * 输出：合并后的 CSSProperties，保留调用方传入的色彩设置。
 * 流程：
 *  1) 基于传入 style 创建浅拷贝，避免突变调用方；
 *  2) 若 width/height 未在 style 指定，则补写 prop；
 *  3) 默认落地 color: inherit，允许调用方覆盖。
 * 错误处理：静态数据整合，不涉及异常。
 * 复杂度：O(1)。
 */
const buildInlineStyle = (
  baseStyle: CSSProperties | undefined,
  widthOverride?: number | string,
  heightOverride?: number | string,
): CSSProperties => {
  const merged: CSSProperties = { ...(baseStyle ?? {}) };

  if (widthOverride != null && merged.width == null) {
    merged.width = widthOverride;
  }

  if (heightOverride != null && merged.height == null) {
    merged.height = heightOverride;
  }

  return merged;
};

/**
 * 意图：按照 single/light/dark 的优先顺序查找可用资源，兼顾历史兼容。
 * 输入：图标名称。
 * 输出：包含 URL 与文本的资产描述；若未收录则返回 undefined。
 * 流程：顺序遍历预设 variant 优先级，遇到首个包含 src/content 的候选即返回。
 * 错误处理：未命中时回退到 fallback 渲染路径。
 * 复杂度：O(variantCount)。
 */
const resolveIconAsset = (name: string): IconAssetPayload | undefined => {
  const entry = registry[name];

  if (!entry) {
    return undefined;
  }

  for (const variant of ICON_VARIANT_PRIORITY) {
    const candidate = entry[variant];

    if (candidate && (candidate.src || candidate.content)) {
      return candidate;
    }
  }

  return undefined;
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
  const asset = resolveIconAsset(name);
  const commonClassName = composeClassName(
    "inline-block align-middle",
    iconRole,
    className,
  );
  const altText = decorative ? "" : (alt ?? name);
  const inlineContent = asset?.content?.trim();

  if (inlineContent) {
    const inlineAccessibility = decorative
      ? { "aria-hidden": true as const }
      : ({ role: "img", "aria-label": altText } as const);

    return (
      <span
        className={commonClassName}
        style={buildInlineStyle(style, width, height)}
        title={title}
        {...inlineAccessibility}
      >
        <span
          style={{ color: "inherit" }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: inlineContent }}
        />
      </span>
    );
  }

  const src = asset?.src;

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
