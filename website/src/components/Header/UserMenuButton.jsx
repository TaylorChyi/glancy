import { useOutsideToggle } from "@/hooks";
import Avatar from "@/components/ui/Avatar";
import ProTag from "./ProTag.jsx";
import styles from "./Header.module.css";

function UserMenuButton({ size, showName, isPro, username, children }) {
  const { open, setOpen, ref: menuRef } = useOutsideToggle(false);

  return (
    <div
      className={`${styles["header-section"]} ${styles["user-menu"]}`}
      ref={menuRef}
    >
      <button
        onClick={() => setOpen(!open)}
        className={showName ? styles["with-name"] : ""}
      >
        <Avatar width={size} height={size} />
        {showName ? (
          <div className={styles.info}>
            <span className={styles.username}>{username}</span>
            {isPro && <ProTag />}
          </div>
        ) : (
          isPro && <ProTag />
        )}
      </button>
      {children({ open, setOpen })}
    </div>
  );
}

export default UserMenuButton;
