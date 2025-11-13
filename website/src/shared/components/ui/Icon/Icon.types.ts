import type { CSSProperties, ReactElement } from "react";
import type { IconVariantResource } from "./iconSourceResolver";
import type { IconRoleClass } from "./iconRoles";

export type LegacyTone = "auto" | "light" | "dark";

export type BaseIconProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  roleClass?: IconRoleClass;
  decorative?: boolean;
  title?: string;
};

export type IconProps = BaseIconProps & {
  alt?: string;
  tone?: LegacyTone;
};

export type FallbackPresetKey = "apple" | "google" | "wechat" | "default";

export type FallbackPreset = {
  label: string;
  variant: FallbackPresetKey;
};

export type IconRenderContext = {
  name: string;
  inline: string | null;
  url: string | null;
  iconRole: IconRoleClass;
  className: string;
  style: CSSProperties | undefined;
  width?: number | string;
  height?: number | string;
  decorative: boolean;
  altText: string;
  title?: string;
};

export type IconRenderer = (
  context: IconRenderContext,
) => ReactElement | null;

export type RenderableAsset = {
  inline: string | null;
  url: string | null;
};

export const pickRenderableAsset = (
  variant: IconVariantResource | null,
): RenderableAsset => {
  if (!variant) {
    return { inline: null, url: null };
  }
  const inline = variant.inline && variant.inline.length > 0 ? variant.inline : null;
  const url = variant.url && variant.url.length > 0 ? variant.url : null;
  return { inline, url };
};
