import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useUser, useHistory, useLanguage } from "@/context";
import { deriveMembershipSnapshot } from "@/utils/membership";
import styles from "./Header.module.css";
import UserMenuButton from "./UserMenuButton.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";
import UserMenuModals from "./UserMenuModals.jsx";

function UserMenu({ size = 24, showName = false, TriggerComponent }) {
  const userStore = useUser();
  const { user, clearUser } = userStore ?? {};
  const { clearHistory } = useHistory();
  const { t } = useLanguage();
  const username = user?.username || "";
  const membership = deriveMembershipSnapshot(user);
  const isPro =
    membership.planId !== "FREE" ||
    user?.isPro === true ||
    (typeof user?.plan === "string" && user.plan !== "free");
  const planName =
    user?.plan ||
    (membership.planId !== "FREE" ? membership.planId.toLowerCase() : "free");
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
      {({ openSettings, openUpgrade, openLogout }) => (
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
              onOpenSettings={() => openSettings("general")}
              onOpenUpgrade={openUpgrade}
              onOpenLogout={openLogout}
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
