import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useUser, useHistory, useLanguage } from "@core/context";
import styles from "./Header.module.css";
import UserMenuButton from "./UserMenuButton.jsx";
import UserMenuDropdown from "./UserMenuDropdown.jsx";
import UserMenuModals from "./UserMenuModals.jsx";

const resolvePlanDetails = (user) => {
  const username = user?.username || "";
  const isPro =
    user?.member || user?.isPro || (user?.plan && user.plan !== "free");
  const planName = user?.plan || (isPro ? "plus" : "free");
  const planLabel = planName
    ? planName.charAt(0).toUpperCase() + planName.slice(1)
    : "";
  return { username, isPro, planLabel };
};

const GuestActions = ({ showName, t }) => (
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

const AuthenticatedMenu = ({
  user,
  clearUser,
  clearHistory,
  showName,
  size,
  TriggerComponent,
  t,
}) => {
  const Trigger = TriggerComponent ?? UserMenuButton;
  const { username, isPro, planLabel } = resolvePlanDetails(user);

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
};

function UserMenu({ size = 24, showName = false, TriggerComponent }) {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();

  if (!user) {
    return <GuestActions showName={showName} t={t} />;
  }

  return (
    <AuthenticatedMenu
      user={user}
      clearUser={clearUser}
      clearHistory={clearHistory}
      showName={showName}
      size={size}
      TriggerComponent={TriggerComponent}
      t={t}
    />
  );
}

UserMenu.propTypes = {
  size: PropTypes.number,
  showName: PropTypes.bool,
  TriggerComponent: PropTypes.elementType,
};

export default UserMenu;
