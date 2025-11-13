import { useTheme } from "@core/context";
import { iconSourceResolver } from "./iconSourceResolver";
import { renderIcon } from "./renderers";
import { legacyToneToRole } from "./iconRoles";
import type { IconProps } from "./Icon.types";
import { pickRenderableAsset } from "./Icon.types";

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
  const altText = decorative ? "" : alt ?? name;

  return renderIcon({
    name,
    inline,
    url,
    iconRole,
    className,
    style,
    width,
    height,
    decorative,
    altText,
    title,
  });
}
