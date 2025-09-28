import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useHistory, useLanguage, useUser } from "@/context";
import UserMenuModals from "@/components/Header/UserMenuModals.jsx";
import { SidebarUserMenu } from "./UserMenu";
import styles from "./UserDock.module.css";

const AVATAR_SIZE = 32;

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
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();

  const isPro = useMemo(
    () =>
      Boolean(
        user?.member || user?.isPro || (user?.plan && user.plan !== "free"),
      ),
    [user],
  );

  if (!user) {
    return null;
  }

  return (
    <footer className={styles.dock} data-plan-tier={isPro ? "premium" : "free"}>
      <UserMenuModals
        isPro={isPro}
        user={user}
        clearUser={clearUser}
        clearHistory={clearHistory}
      >
        {({ openSettings, openShortcuts, openUpgrade, openLogout }) => (
          <SidebarUserMenu
            user={user}
            size={AVATAR_SIZE}
            t={t}
            onOpenSettings={() => openSettings("general")}
            onOpenUpgrade={openUpgrade}
            onOpenKeyboard={openShortcuts}
            onOpenLogout={openLogout}
          />
        )}
      </UserMenuModals>
    </footer>
  );
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
