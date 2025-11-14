import { useCallback, useEffect, useMemo, useState } from "react";

export const useUserMenuModals = ({ isPro, user, clearUser, clearHistory }) => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsState, setSettingsState] = useState({ open: false, section: "account" });

  const openSettings = useCallback((section = "account") => {
    setSettingsState({ open: true, section });
  }, []);

  useEffect(() => {
    const handleShortcuts = () => openSettings("keyboard");
    document.addEventListener("open-shortcuts", handleShortcuts);
    return () => {
      document.removeEventListener("open-shortcuts", handleShortcuts);
    };
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
    () => ({ openSettings, openShortcuts, openUpgrade, openLogout }),
    [openLogout, openSettings, openShortcuts, openUpgrade],
  );

  const modals = useMemo(
    () => ({
      isPro,
      upgradeOpen,
      closeUpgrade,
      settingsState,
      closeSettings,
      logoutOpen,
      confirmLogout,
      closeLogout,
      email: user?.email ?? "",
    }),
    [
      closeLogout,
      closeSettings,
      closeUpgrade,
      confirmLogout,
      isPro,
      logoutOpen,
      settingsState,
      upgradeOpen,
      user?.email,
    ],
  );

  return { handlers, modals };
};
