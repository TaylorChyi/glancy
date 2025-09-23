import { useUser, useHistory } from "@/context";
import { useLanguage } from "@/context";
import styles from "./Header.module.css";
import Avatar from "@/components/ui/Avatar";
import { Link } from "react-router-dom";
import UserMenuButton from "./UserMenuButton.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";
import UserMenuModals from "./UserMenuModals.jsx";

function UserMenu({ size = 24, showName = false }) {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();
  const username = user?.username || "";
  const isPro =
    user?.member || user?.isPro || (user?.plan && user.plan !== "free");

  if (!user) {
    return (
      <div
        className={`${styles["header-section"]} ${styles["login-actions"]} ${showName ? styles["with-name"] : ""}`}
      >
        <Link to="/login" className={styles["login-btn"]}>
          {t.navLogin}
        </Link>
        <Link to="/register" className={styles["login-btn"]}>
          {t.navRegister}
        </Link>
      </div>
    );
  }

  return (
    <UserMenuModals
      isPro={isPro}
      user={user}
      clearUser={clearUser}
      clearHistory={clearHistory}
    >
      {({
        openProfile,
        openSettings,
        openShortcuts,
        openUpgrade,
        openLogout,
      }) => (
        <UserMenuButton
          size={size}
          showName={showName}
          isPro={isPro}
          username={username}
        >
          {({ open, setOpen }) => (
            <UserMenuDropdown
              open={open}
              setOpen={setOpen}
              t={t}
              isPro={isPro}
              username={username}
              openProfile={openProfile}
              openSettings={openSettings}
              openShortcuts={openShortcuts}
              openUpgrade={openUpgrade}
              openLogout={openLogout}
            />
          )}
        </UserMenuButton>
      )}
    </UserMenuModals>
  );
}

export default UserMenu;
