import React, { ElementType } from "react";
import styles from "./Button.module.css";

interface ButtonProps<T extends ElementType = "button">
  extends React.ComponentPropsWithoutRef<T> {
  /**
   * 自定义元素类型
   */
  as?: T;
  /** 额外类名 */
  className?: string;
  children?: React.ReactNode;
}

function Button<T extends ElementType = "button">({
  as,
  className = "",
  children,
  ...props
}: ButtonProps<T>) {
  const Component = (as || "button") as ElementType;
  return (
    <Component className={`${styles.button} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export default Button;
