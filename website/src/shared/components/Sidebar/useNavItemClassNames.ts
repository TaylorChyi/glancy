import { useMemo } from "react";
import {
  buildBaseClassName,
  buildLabelClassName,
  buildNavLinkClassName,
  buildResolvedClassName,
} from "./navItemClassNames";
import type { VariantStyles } from "./navItemClassNames";

type UseNavItemClassNamesArgs = {
  active: boolean;
  allowMultilineLabel: boolean;
  className: string;
  tone: "default" | "muted";
  variantStyles: VariantStyles;
};

export type UseNavItemClassNamesResult = {
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

export function useNavItemClassNames({
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
