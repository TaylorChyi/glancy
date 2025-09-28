import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  ForwardedRef,
  MouseEventHandler,
} from "react";
import Avatar from "@/components/ui/Avatar";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./UserMenu.module.css";

type UserButtonProps = {
  open: boolean;
  username: string;
  planLabel: string;
  size: number;
  onToggle: MouseEventHandler<HTMLButtonElement>;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-controls" | "aria-label"
>;

function UserButton(
  {
    open,
    username,
    planLabel,
    size,
    onToggle,
    ...accessibility
  }: UserButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <button
      type="button"
      ref={ref}
      className={styles["menu-trigger"]}
      data-open={open ? "true" : "false"}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      {...accessibility}
    >
      <Avatar
        width={size}
        height={size}
        className={styles["menu-trigger-avatar"]}
      />
      <span className={styles["menu-trigger-body"]}>
        <span className={styles["menu-trigger-name"]}>{username}</span>
        {planLabel ? (
          <span className={styles["menu-trigger-plan"]}>{planLabel}</span>
        ) : null}
      </span>
      <span className={styles["menu-trigger-caret"]} aria-hidden="true">
        <ThemeIcon name="chevron-down" width={16} height={16} />
      </span>
      <span className={styles["sr-only"]}>
        {open ? "关闭用户菜单" : "打开用户菜单"}
      </span>
    </button>
  );
}

export default forwardRef(UserButton);
