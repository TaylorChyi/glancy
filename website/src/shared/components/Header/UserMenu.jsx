import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useUser, useHistory, useLanguage } from "@core/context";
import styles from "./Header.module.css";
import AuthenticatedUserMenu from "./AuthenticatedUserMenu.jsx";

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

function UserMenu({ size = 24, showName = false, TriggerComponent }) {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();

  if (!user) {
    return <GuestActions showName={showName} t={t} />;
  }

  return (
    <AuthenticatedUserMenu
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
