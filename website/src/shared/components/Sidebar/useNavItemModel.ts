import { useCallback, useMemo } from "react";
import type { MouseEvent, ReactNode } from "react";
import styles from "./NavItem.module.css";

const INTERACTION_VARIANTS = {
  accent: {
    baseClass: "",
    activeClass: styles.active,
  },
  flat: {
    baseClass: styles.flat,
    activeClass: styles["flat-active"],
  },
};

const joinClassNames = (...tokens: Array<string | undefined | null | false>) =>
  tokens.filter(Boolean).join(" ");

type NavItemModelInput = {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  active?: boolean;
  to?: string;
  href?: string;
  className?: string;
  tone?: "default" | "muted";
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit" | "reset";
  children?: ReactNode;
  variant?: keyof typeof INTERACTION_VARIANTS;
  allowMultilineLabel?: boolean;
  [key: string]: unknown;
};

type NavItemClassNames = {
  base: string;
  navLink: (isActive: boolean) => string;
};

type NavItemViewProps = {
  componentType: "navlink" | "anchor" | "button";
  classNames: NavItemClassNames;
  handlers: {
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    ariaCurrent?: "page";
  };
  link: {
    to?: string;
    href?: string;
    type?: "button" | "submit" | "reset";
  };
  content: {
    icon?: ReactNode;
    label: ReactNode;
    description?: ReactNode;
    labelClassName: string;
    children?: ReactNode;
  };
  restProps?: Record<string, unknown>;
};

export type NavItemModel = {
  viewProps: NavItemViewProps;
};

export const useNavItemModel = (props: NavItemModelInput): NavItemModel => {
  const {
    icon,
    label,
    description,
    active = false,
    to,
    href,
    className = "",
    tone = "default",
    onClick,
    type = "button",
    children = null,
    variant = "accent",
    allowMultilineLabel = false,
    ...restProps
  } = props;

  const variantStyles =
    INTERACTION_VARIANTS[variant] ?? INTERACTION_VARIANTS.accent;

  const labelClassName = useMemo(
    () =>
      joinClassNames(
        styles.label,
        allowMultilineLabel ? styles["label-multiline"] : "",
      ),
    [allowMultilineLabel],
  );

  const baseClassName = useMemo(
    () =>
      joinClassNames(
        styles.item,
        allowMultilineLabel ? styles["item-multiline"] : "",
        tone === "muted" ? styles.muted : "",
        variantStyles.baseClass,
        className,
      ),
    [allowMultilineLabel, className, tone, variantStyles.baseClass],
  );

  const activeClassName = variantStyles.activeClass;

  const resolvedClassName = useMemo(
    () => joinClassNames(baseClassName, active ? activeClassName : ""),
    [active, activeClassName, baseClassName],
  );

  const navLinkClassName = useCallback(
    (isActive: boolean) =>
      joinClassNames(
        baseClassName,
        (isActive || active) ? activeClassName : "",
      ),
    [active, activeClassName, baseClassName],
  );

  const componentType: NavItemViewProps["componentType"] = to
    ? "navlink"
    : href
      ? "anchor"
      : "button";

  return {
    viewProps: {
      componentType,
      classNames: {
        base: resolvedClassName,
        navLink: navLinkClassName,
      },
      handlers: {
        onClick,
        ariaCurrent: active ? "page" : undefined,
      },
      link: {
        to,
        href,
        type,
      },
      content: {
        icon,
        label,
        description,
        labelClassName,
        children,
      },
      restProps,
    },
  };
};

export default useNavItemModel;
