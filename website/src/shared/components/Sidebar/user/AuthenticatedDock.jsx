import PropTypes from "prop-types";
import UserMenu from "../UserMenu";
import styles from "../UserDock.module.css";

function AuthenticatedDock({
  displayName,
  planLabel,
  labels,
  onOpenSettings,
  onOpenLogout,
}) {
  return (
    <div className={styles.wrapper} data-testid="sidebar-user-dock">
      <UserMenu
        displayName={displayName}
        planLabel={planLabel}
        labels={labels}
        onOpenSettings={onOpenSettings}
        onOpenLogout={onOpenLogout}
      />
    </div>
  );
}

AuthenticatedDock.propTypes = {
  displayName: PropTypes.string.isRequired,
  planLabel: PropTypes.string,
  labels: PropTypes.shape({
    settings: PropTypes.string.isRequired,
    logout: PropTypes.string.isRequired,
  }).isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onOpenLogout: PropTypes.func.isRequired,
};

AuthenticatedDock.defaultProps = {
  planLabel: "",
};

export default AuthenticatedDock;
