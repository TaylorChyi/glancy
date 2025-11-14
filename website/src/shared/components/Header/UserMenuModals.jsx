import PropTypes from "prop-types";
import SettingsModal from "@shared/components/modals/SettingsModal.jsx";
import UpgradeModal from "@shared/components/modals/UpgradeModal.jsx";
import LogoutConfirmModal from "@shared/components/modals/LogoutConfirmModal.jsx";
import { useUserMenuModals } from "./useUserMenuModals.js";

function UserMenuModals({ isPro, user, clearUser, clearHistory, children }) {
  const { handlers, modals } = useUserMenuModals({
    isPro,
    user,
    clearUser,
    clearHistory,
  });

  return (
    <>
      {children(handlers)}
      {!modals.isPro && (
        <UpgradeModal open={modals.upgradeOpen} onClose={modals.closeUpgrade} />
      )}
      <SettingsModal
        open={modals.settingsState.open}
        onClose={modals.closeSettings}
        initialSection={modals.settingsState.section}
      />
      <LogoutConfirmModal
        open={modals.logoutOpen}
        onConfirm={modals.confirmLogout}
        onCancel={modals.closeLogout}
        email={modals.email}
      />
    </>
  );
}

UserMenuModals.propTypes = {
  isPro: PropTypes.bool,
  user: PropTypes.object,
  clearUser: PropTypes.func.isRequired,
  clearHistory: PropTypes.func.isRequired,
  children: PropTypes.func.isRequired,
};

UserMenuModals.defaultProps = {
  isPro: false,
  user: undefined,
};

export default UserMenuModals;
