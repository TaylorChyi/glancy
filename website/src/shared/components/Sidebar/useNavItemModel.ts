import type { MouseEvent, ReactNode } from "react";
import {
  getVariantStyles,
  resolveComponentType,
} from "./navItemClassNames";
import { useNavItemClassNames } from "./useNavItemClassNames";
import type { UseNavItemClassNamesResult } from "./useNavItemClassNames";
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

const NAV_ITEM_MODEL_KNOWN_KEYS = new Set<string>([
  "icon",
  "label",
  "description",
  "active",
  "to",
  "href",
  "className",
  "tone",
  "onClick",
  "type",
  "children",
  "variant",
  "allowMultilineLabel",
]);

function normalizeNavItemModelInput(props: NavItemModelInput): NormalizedNavItemModelInput {
  const restProps = getNavItemRestProps(props);
  const normalizedCore = {
    active: props.active ?? false,
    allowMultilineLabel: props.allowMultilineLabel ?? false,
    children: props.children ?? null,
    className: props.className ?? "",
    tone: props.tone ?? "default",
    type: props.type ?? "button",
    variant: props.variant ?? "accent",
    description: props.description,
    href: props.href,
    icon: props.icon,
    label: props.label,
    onClick: props.onClick,
    to: props.to,
  };
  return { ...normalizedCore, restProps };
}

function getNavItemRestProps(props: NavItemModelInput): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !NAV_ITEM_MODEL_KNOWN_KEYS.has(key)),
  );
}

function useNavItemViewProps(props: NavItemModelInput): NavItemViewProps {
  const normalizedProps = normalizeNavItemModelInput(props);
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
  return {
    componentType,
    classNames: {
      base: classNames.resolvedClassName,
      navLink: classNames.navLinkClassName,
    },
    handlers: buildNavItemHandlers(props.onClick, props.active),
    link: buildNavItemLink(props.to, props.href, props.type),
    content: buildNavItemContent({
      icon: props.icon,
      label: props.label,
      description: props.description,
      labelClassName: classNames.labelClassName,
      children: props.children,
    }),
    restProps: props.restProps,
  };
}

function buildNavItemHandlers(
  onClick?: (event: MouseEvent<HTMLElement>) => void,
  active?: boolean,
) {
  return { onClick, ariaCurrent: active ? "page" : undefined };
}

function buildNavItemLink(
  to?: string,
  href?: string,
  type?: "button" | "submit" | "reset",
) {
  return { to, href, type };
}

type BuildNavItemContentArgs = {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  labelClassName: string;
  children?: ReactNode;
};

function buildNavItemContent({
  icon,
  label,
  description,
  labelClassName,
  children,
}: BuildNavItemContentArgs) {
  return {
    icon,
    label,
    description,
    labelClassName,
    children,
  };
}

export default useNavItemModel;
