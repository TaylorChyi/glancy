import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import SettingsModal from "@shared/components/modals/SettingsModal.jsx";
import UpgradeModal from "@shared/components/modals/UpgradeModal.jsx";
import LogoutConfirmModal from "@shared/components/modals/LogoutConfirmModal.jsx";

function UserMenuModals({ isPro, user, clearUser, clearHistory, children }) {
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

  const handlers = {
    openSettings,
    openShortcuts: () => openSettings("keyboard"),
    openUpgrade: () => setUpgradeOpen(true),
    openLogout: () => setLogoutOpen(true),
  };

  return (
    <>
      {children(handlers)}
      {!isPro && (
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
        />
      )}
      <SettingsModal
        open={settingsState.open}
        onClose={() =>
          setSettingsState((previous) => ({ ...previous, open: false }))
        }
        initialSection={settingsState.section}
      />
      <LogoutConfirmModal
        open={logoutOpen}
        onConfirm={() => {
          clearHistory();
          clearUser();
          setLogoutOpen(false);
        }}
        onCancel={() => setLogoutOpen(false)}
        email={user?.email || ""}
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
