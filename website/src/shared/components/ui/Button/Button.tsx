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
  const dataAttributes: Record<string, string> = {
    "data-variant": variant,
    ...(emphasis !== "default" ? { "data-emphasis": emphasis } : {}),
    ...(iconTone ? { "data-icon": iconTone } : {}),
    ...(labelTone ? { "data-label": labelTone } : {}),
  };

  const resolvedClassName = joinClass(
    "btn",
    shadow === "elev" ? "shadow-elev" : undefined,
    className,
  );

  return (
    <button className={resolvedClassName} {...dataAttributes} {...rest}>
      {children}
    </button>
  );
}
