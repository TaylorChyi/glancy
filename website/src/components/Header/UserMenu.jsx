import { useUser, useHistory } from "@/context";
import { useLanguage } from "@/context";
import styles from "./Header.module.css";
import { Link } from "react-router-dom";
import UserMenuButton from "./UserMenuButton.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";
import UserMenuModals from "./UserMenuModals.jsx";
import PropTypes from "prop-types";

function UserMenu({ size = 24, showName = false, TriggerComponent }) {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();
  const username = user?.username || "";
  const isPro =
    user?.member || user?.isPro || (user?.plan && user.plan !== "free");
  const planName = user?.plan || (isPro ? "plus" : "free");
  const planLabel = planName
    ? planName.charAt(0).toUpperCase() + planName.slice(1)
    : "";

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

  const Trigger = TriggerComponent ?? UserMenuButton;

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
        <Trigger
          size={size}
          showName={showName}
          isPro={isPro}
          username={username}
          planLabel={planLabel}
        >
          {({ open, setOpen }) => (
            <UserMenuDropdown
              open={open}
              setOpen={setOpen}
              t={t}
              isPro={isPro}
              openProfile={openProfile}
              openSettings={openSettings}
              openShortcuts={openShortcuts}
              openUpgrade={openUpgrade}
              openLogout={openLogout}
            />
          )}
        </Trigger>
      )}
    </UserMenuModals>
  );
}

UserMenu.propTypes = {
  size: PropTypes.number,
  showName: PropTypes.bool,
  TriggerComponent: PropTypes.elementType,
};

export default UserMenu;
