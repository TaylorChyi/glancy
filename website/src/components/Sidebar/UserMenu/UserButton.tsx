import { forwardRef, KeyboardEvent, MouseEvent } from "react";
import Avatar from "@/components/ui/Avatar";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./UserButton.module.css";

export interface UserButtonProps {
  displayName: string;
  planLabel?: string;
  onToggle: () => void;
  open: boolean;
}

const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ displayName, planLabel, onToggle, open }, ref) => {
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp"
      ) {
        event.preventDefault();
        onToggle();
      }
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onToggle();
    };

    return (
      <button
        type="button"
        ref={ref}
        className={styles.button}
        data-open={open}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <Avatar width={32} height={32} className={styles.avatar} />
        <span className={styles.meta}>
          <span className={styles.name}>{displayName || ""}</span>
          {planLabel ? <span className={styles.plan}>{planLabel}</span> : null}
        </span>
        <ThemeIcon
          name="chevron-up-down"
          width={18}
          height={18}
          className={styles.chevron}
        />
      </button>
    );
  },
);

UserButton.displayName = "UserButton";

export default UserButton;
