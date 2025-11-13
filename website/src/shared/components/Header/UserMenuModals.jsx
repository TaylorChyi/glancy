import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import SettingsModal from "@shared/components/modals/SettingsModal.jsx";
import UpgradeModal from "@shared/components/modals/UpgradeModal.jsx";
import LogoutConfirmModal from "@shared/components/modals/LogoutConfirmModal.jsx";

const useUserMenuModalState = ({ isPro, user, clearUser, clearHistory }) => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsState, setSettingsState] = useState({
    open: false,
    section: "account",
  });

  const openSettings = useCallback((section = "account") => {
    setSettingsState({ open: true, section });
  }, []);

  useEffect(() => {
    const handleShortcuts = () => openSettings("keyboard");
    document.addEventListener("open-shortcuts", handleShortcuts);
    return () =>
      document.removeEventListener("open-shortcuts", handleShortcuts);
  }, [openSettings]);

  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);
  const closeLogout = useCallback(() => setLogoutOpen(false), []);
  const closeSettings = useCallback(
    () => setSettingsState((previous) => ({ ...previous, open: false })),
    [],
  );

  const openUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const openLogout = useCallback(() => setLogoutOpen(true), []);
  const openShortcuts = useCallback(() => openSettings("keyboard"), [openSettings]);

  const confirmLogout = useCallback(() => {
    clearHistory();
    clearUser();
    closeLogout();
  }, [clearHistory, clearUser, closeLogout]);

  const handlers = useMemo(
    () => ({
      openSettings,
      openShortcuts,
      openUpgrade,
      openLogout,
    }),
    [openLogout, openSettings, openShortcuts, openUpgrade],
  );

  return {
    handlers,
    modals: {
      isPro,
      upgradeOpen,
      closeUpgrade,
      settingsState,
      closeSettings,
      logoutOpen,
      confirmLogout,
      closeLogout,
      email: user?.email ?? "",
    },
  };
};

function UserMenuModals({ isPro, user, clearUser, clearHistory, children }) {
  const { handlers, modals } = useUserMenuModalState({
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
