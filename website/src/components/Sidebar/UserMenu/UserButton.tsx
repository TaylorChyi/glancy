import { forwardRef } from "react";
import Avatar from "@/components/ui/Avatar";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./UserMenu.module.css";

type UserButtonProps = {
  name: string;
  planLabel?: string | null;
  open: boolean;
  menuId: string;
  onToggle: () => void;
};

const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ name, planLabel, open, menuId, onToggle }, ref) => (
    <button
      type="button"
      ref={ref}
      className={styles.trigger}
      data-open={open}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={onToggle}
    >
      <Avatar width={32} height={32} className={styles["trigger-avatar"]} />
      <span className={styles["trigger-details"]}>
        <span className={styles["trigger-name"]}>{name}</span>
        {planLabel ? (
          <span className={styles["trigger-plan"]}>{planLabel}</span>
        ) : null}
      </span>
      <span className={styles["trigger-indicator"]} aria-hidden="true">
        <ThemeIcon name="chevron-down" width={16} height={16} />
      </span>
    </button>
  ),
);

UserButton.displayName = "UserButton";

export default UserButton;
