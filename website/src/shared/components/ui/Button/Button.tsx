import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * 背景：
 *  - 旧按钮组件依赖 CSS Module，缺乏主题变量与语义区分，难以复用。
 * 目的：
 *  - 将按钮统一接入 `btn` 组件变量体系，通过 data-* 属性驱动不同语义与强调层级。
 * 关键决策与取舍：
 *  - 采用无状态展示组件，允许上层容器控制 loading/禁用等逻辑；
 *  - 暴露 iconTone/labelTone 以满足同主题内的反向配色需求。
 * 影响范围：
 *  - 所有引用 Button 组件的场景（表单、工具栏等）。
 * 演进与TODO：
 *  - 可在未来加入 loading/leadingIcon 等增强型 props，并与 a11y 规范联动。
 */

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
  };

  if (emphasis !== "default") {
    dataAttributes["data-emphasis"] = emphasis;
  }
  if (iconTone) {
    dataAttributes["data-icon"] = iconTone;
  }
  if (labelTone) {
    dataAttributes["data-label"] = labelTone;
  }

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
