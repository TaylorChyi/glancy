import { useMemo } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  buildBaseClassName,
  buildLabelClassName,
  buildNavLinkClassName,
  buildResolvedClassName,
  getVariantStyles,
  resolveComponentType,
} from "./navItemClassNames";
import type { InteractionVariant } from "./navItemClassNames";

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
  variant?: InteractionVariant;
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

export function useNavItemModel(props: NavItemModelInput): NavItemModel {
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

  const variantStyles = getVariantStyles(variant);

  const labelClassName = useMemo(
    () => buildLabelClassName(allowMultilineLabel),
    [allowMultilineLabel],
  );

  const baseClassName = useMemo(
    () =>
      buildBaseClassName({
        allowMultilineLabel,
        tone,
        variantBaseClass: variantStyles.baseClass,
        className,
      }),
    [allowMultilineLabel, className, tone, variantStyles.baseClass],
  );

  const activeClassName = variantStyles.activeClass;

  const resolvedClassName = useMemo(
    () =>
      buildResolvedClassName({
        baseClassName,
        activeClassName,
        active,
      }),
    [active, activeClassName, baseClassName],
  );

  const navLinkClassName = useMemo(
    () =>
      buildNavLinkClassName({
        baseClassName,
        activeClassName,
        active,
      }),
    [active, activeClassName, baseClassName],
  );

  const componentType: NavItemViewProps["componentType"] = resolveComponentType({
    to,
    href,
  });

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
