import type { ResolvedTheme } from "@shared/theme/mode";
import type { LegacyTone } from "./Icon.types";

export const ROLE_CLASSNAME_MAP = Object.freeze({
  onsurface: "text-onsurface",
  onsurfaceStrong: "text-onsurface-strong",
  onprimary: "text-onprimary",
  muted: "text-muted",
  success: "text-onsuccess",
  warning: "text-onwarning",
  danger: "text-ondanger",
  inherit: "",
} as const);

export type IconRoleClass = keyof typeof ROLE_CLASSNAME_MAP;

const DEFAULT_ROLE_BY_THEME: Record<ResolvedTheme, IconRoleClass> = Object.freeze({
  light: "onsurface",
  dark: "onsurface",
});

export const legacyToneToRole = (
  tone: LegacyTone | undefined,
  resolvedTheme: ResolvedTheme,
): IconRoleClass => {
  if (tone === "light") {
    return resolvedTheme === "light" ? "onsurfaceStrong" : "onsurface";
  }
  return DEFAULT_ROLE_BY_THEME[resolvedTheme] ?? "onsurface";
};

export const composeClassName = (
  base: string,
  roleClass: IconRoleClass,
  external?: string,
) => [base, ROLE_CLASSNAME_MAP[roleClass], external].filter(Boolean).join(" ");
