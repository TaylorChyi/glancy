import styles from "./NavItem.module.css";

type ClassNameToken = string | undefined | null | false;

type InteractionVariant = "accent" | "flat";

type VariantStyles = {
  baseClass: string;
  activeClass: string;
};

const INTERACTION_VARIANTS: Record<InteractionVariant, VariantStyles> = {
  accent: {
    baseClass: "",
    activeClass: styles.active,
  },
  flat: {
    baseClass: styles.flat,
    activeClass: styles["flat-active"],
  },
};

export const getVariantStyles = (
  variant: InteractionVariant,
): VariantStyles => INTERACTION_VARIANTS[variant] ?? INTERACTION_VARIANTS.accent;

export const joinClassNames = (...tokens: ClassNameToken[]): string =>
  tokens.filter(Boolean).join(" ");

export const buildLabelClassName = (allowMultilineLabel: boolean): string =>
  joinClassNames(
    styles.label,
    allowMultilineLabel ? styles["label-multiline"] : "",
  );

export const buildBaseClassName = ({
  allowMultilineLabel,
  tone,
  variantBaseClass,
  className,
}: {
  allowMultilineLabel: boolean;
  tone: "default" | "muted";
  variantBaseClass: string;
  className: string;
}): string =>
  joinClassNames(
    styles.item,
    allowMultilineLabel ? styles["item-multiline"] : "",
    tone === "muted" ? styles.muted : "",
    variantBaseClass,
    className,
  );

export const buildResolvedClassName = ({
  baseClassName,
  activeClassName,
  active,
}: {
  baseClassName: string;
  activeClassName: string;
  active: boolean;
}): string => joinClassNames(baseClassName, active ? activeClassName : "");

export const buildNavLinkClassName = ({
  baseClassName,
  activeClassName,
  active,
}: {
  baseClassName: string;
  activeClassName: string;
  active: boolean;
}) =>
  (isActive: boolean) =>
    joinClassNames(baseClassName, (isActive || active) ? activeClassName : "");

export const resolveComponentType = ({
  to,
  href,
}: {
  to?: string;
  href?: string;
}): "navlink" | "anchor" | "button" =>
  to ? "navlink" : href ? "anchor" : "button";

export type { InteractionVariant, VariantStyles };
