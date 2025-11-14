import type { ButtonHTMLAttributes, ReactNode } from "react";



type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonEmphasis = "default" | "soft";
type ToneOption = "light" | "dark";
type ShadowOption = "none" | "elev";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  emphasis?: ButtonEmphasis;
  iconTone?: ToneOption;
  labelTone?: ToneOption;
  shadow?: ShadowOption;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const joinClass = (...parts: Array<string | undefined>) =>
  parts.filter(Boolean).join(" ");

const getDataAttributes = ({
  variant,
  emphasis,
  iconTone,
  labelTone,
}: Required<Pick<ButtonProps, "variant">> &
  Partial<Pick<ButtonProps, "emphasis" | "iconTone" | "labelTone">>) => {
  const attributes: Record<string, string> = {
    "data-variant": variant,
  };

  if (emphasis && emphasis !== "default") {
    attributes["data-emphasis"] = emphasis;
  }
  if (iconTone) {
    attributes["data-icon"] = iconTone;
  }
  if (labelTone) {
    attributes["data-label"] = labelTone;
  }

  return attributes;
};

const getButtonClassName = (
  shadow: ButtonProps["shadow"],
  className: ButtonProps["className"],
) => joinClass("btn", shadow === "elev" ? "shadow-elev" : undefined, className);

export default function Button({
  children,
  variant = "secondary",
  emphasis = "default",
  iconTone,
  labelTone,
  shadow = "none",
  className = "",
  ...rest
}: ButtonProps) {
  const dataAttributes = getDataAttributes({
    variant,
    emphasis,
    iconTone,
    labelTone,
  });

  return (
    <button
      className={getButtonClassName(shadow, className)}
      {...dataAttributes}
      {...rest}
    >
      {children}
    </button>
  );
}
