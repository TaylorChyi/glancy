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

type UseNavItemClassNamesArgs = {
  active: boolean;
  allowMultilineLabel: boolean;
  className: string;
  tone: "default" | "muted";
  variantStyles: ReturnType<typeof getVariantStyles>;
};

type UseNavItemClassNamesResult = {
  labelClassName: string;
  resolvedClassName: string;
  navLinkClassName: string;
};

function useLabelClassName(allowMultilineLabel: boolean): string {
  return useMemo(
    () => buildLabelClassName(allowMultilineLabel),
    [allowMultilineLabel],
  );
}

type BaseClassNameArgs = {
  allowMultilineLabel: boolean;
  tone: "default" | "muted";
  variantBaseClass: string;
  className: string;
};

function useBaseClassName({
  allowMultilineLabel,
  tone,
  variantBaseClass,
  className,
}: BaseClassNameArgs): string {
  return useMemo(
    () =>
      buildBaseClassName({
        allowMultilineLabel,
        tone,
        variantBaseClass,
        className,
      }),
    [allowMultilineLabel, className, tone, variantBaseClass],
  );
}

type NamedClassNameArgs = {
  baseClassName: string;
  activeClassName: string;
  active: boolean;
};

function useResolvedClassName({
  baseClassName,
  activeClassName,
  active,
}: NamedClassNameArgs): string {
  return useMemo(
    () =>
      buildResolvedClassName({
        baseClassName,
        activeClassName,
        active,
      }),
    [active, activeClassName, baseClassName],
  );
}

function useNavLinkClassName({
  baseClassName,
  activeClassName,
  active,
}: NamedClassNameArgs): string {
  return useMemo(
    () =>
      buildNavLinkClassName({
        baseClassName,
        activeClassName,
        active,
      }),
    [active, activeClassName, baseClassName],
  );
}

function useNavItemClassNames({
  active,
  allowMultilineLabel,
  className,
  tone,
  variantStyles,
}: UseNavItemClassNamesArgs): UseNavItemClassNamesResult {
  const labelClassName = useLabelClassName(allowMultilineLabel);
  const baseClassName = useBaseClassName({
    allowMultilineLabel,
    tone,
    variantBaseClass: variantStyles.baseClass,
    className,
  });
  const resolvedClassName = useResolvedClassName({
    baseClassName,
    activeClassName: variantStyles.activeClass,
    active,
  });
  const navLinkClassName = useNavLinkClassName({
    baseClassName,
    activeClassName: variantStyles.activeClass,
    active,
  });

  return { labelClassName, resolvedClassName, navLinkClassName };
}

export type NavItemModel = {
  viewProps: NavItemViewProps;
};

export function useNavItemModel(props: NavItemModelInput): NavItemModel {
  return {
    viewProps: useNavItemViewProps(props),
  };
}

type NormalizedNavItemModelInput = {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  active: boolean;
  to?: string;
  href?: string;
  className: string;
  tone: "default" | "muted";
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  type: "button" | "submit" | "reset";
  children: ReactNode | null;
  variant: InteractionVariant;
  allowMultilineLabel: boolean;
  restProps: Record<string, unknown>;
};

function useNavItemViewProps(props: NavItemModelInput): NavItemViewProps {
  const { active, allowMultilineLabel, children, className, description, href, icon, label, onClick, to, tone, type, variant, ...restProps } = props;
  const normalizedProps: NormalizedNavItemModelInput = {
    icon, label, description, to, href, onClick, restProps,
    active: active ?? false,
    className: className ?? "",
    tone: tone ?? "default",
    type: type ?? "button",
    children: children ?? null,
    variant: variant ?? "accent",
    allowMultilineLabel: allowMultilineLabel ?? false,
  };
  const variantStyles = getVariantStyles(normalizedProps.variant);
  const classNames = useNavItemClassNames({
    active: normalizedProps.active,
    allowMultilineLabel: normalizedProps.allowMultilineLabel,
    className: normalizedProps.className,
    tone: normalizedProps.tone,
    variantStyles,
  });
  const componentType: NavItemViewProps["componentType"] = resolveComponentType({
    to: normalizedProps.to,
    href: normalizedProps.href,
  });
  return buildNavItemViewProps({
    componentType,
    classNames,
    props: normalizedProps,
  });
}

type BuildNavItemViewPropsArgs = {
  componentType: NavItemViewProps["componentType"];
  classNames: UseNavItemClassNamesResult;
  props: NormalizedNavItemModelInput;
};

function buildNavItemViewProps({
  componentType,
  classNames,
  props,
}: BuildNavItemViewPropsArgs): NavItemViewProps {
  const { icon, label, description, children, onClick, active, to, href, type, restProps } = props;
  return {
    componentType,
    classNames: {
      base: classNames.resolvedClassName,
      navLink: classNames.navLinkClassName,
    },
    handlers: { onClick, ariaCurrent: active ? "page" : undefined },
    link: { to, href, type },
    content: {
      icon,
      label,
      description,
      labelClassName: classNames.labelClassName,
      children,
    },
    restProps,
  };
}

export default useNavItemModel;
