import { memo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useLanguage, useUser } from "@/context";
import { useOutsideToggle } from "@/hooks";
import Avatar from "@/components/ui/Avatar";
import { EllipsisVerticalIcon } from "@/components/ui/Icon";
import UserMenu from "@/components/Header/UserMenu.jsx";
import headerStyles from "@/components/Header/Header.module.css";
import styles from "./UserDock.module.css";

function UserDockTrigger({
  size,
  showName,
  isPro,
  username,
  planLabel,
  children,
}) {
  const { open, setOpen, ref } = useOutsideToggle(false);
  const displayName = showName ? username || planLabel || "" : username || "";
  const displayPlan = planLabel || "";

  const toggleMenu = () => {
    setOpen((prev) => !prev);
  };

  return (
    <footer
      ref={ref}
      className={`${styles.dock} ${headerStyles["user-menu"]}`}
      data-plan-tier={isPro ? "premium" : "free"}
    >
      <Avatar width={size} height={size} className={styles.avatar} />
      <div className={styles.info}>
        <span className={styles.name}>{displayName}</span>
        {displayPlan ? (
          <span className={styles.plan}>{displayPlan}</span>
        ) : null}
      </div>
      <button
        type="button"
        className={styles.more}
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="打开用户菜单"
      >
        <EllipsisVerticalIcon width={18} height={18} />
      </button>
      {children({ open, setOpen })}
    </footer>
  );
}

UserDockTrigger.propTypes = {
  size: PropTypes.number.isRequired,
  showName: PropTypes.bool.isRequired,
  isPro: PropTypes.bool.isRequired,
  username: PropTypes.string.isRequired,
  planLabel: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
};

function AnonymousDock() {
  const { t } = useLanguage();

  return (
    <footer className={styles.dock}>
      <div className={styles["auth-actions"]}>
        <Link to="/login" className={styles["auth-button"]}>
          {t.navLogin}
        </Link>
        <Link to="/register" className={styles["auth-button-primary"]}>
          {t.navRegister}
        </Link>
      </div>
    </footer>
  );
}

const MemoizedAnonymousDock = memo(AnonymousDock);

function AuthenticatedDock() {
  return <UserMenu size={32} showName TriggerComponent={UserDockTrigger} />;
}

const MemoizedAuthenticatedDock = memo(AuthenticatedDock);

function UserDock() {
  const { user } = useUser();

  if (!user) {
    return <MemoizedAnonymousDock />;
  }

  return <MemoizedAuthenticatedDock />;
}

export default memo(UserDock);
