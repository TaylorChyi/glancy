import { useCallback, useEffect, useMemo, useState } from "react";

const useUserMenuModalState = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsState, setSettingsState] = useState({ open: false, section: "account" });

  const openSettings = useCallback((section = "account") => {
    setSettingsState({ open: true, section });
  }, []);

  useEffect(() => {
    const handleShortcuts = () => openSettings("keyboard");
    document.addEventListener("open-shortcuts", handleShortcuts);
    return () => document.removeEventListener("open-shortcuts", handleShortcuts);
  }, [openSettings]);

  return {
    upgradeOpen,
    logoutOpen,
    settingsState,
    openSettings,
    setUpgradeOpen,
    setLogoutOpen,
    setSettingsState,
  };
};

const useUserMenuModalHandlers = (
  { openSettings, setUpgradeOpen, setLogoutOpen, setSettingsState },
  { clearHistory, clearUser },
) => {
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), [setUpgradeOpen]);
  const closeLogout = useCallback(() => setLogoutOpen(false), [setLogoutOpen]);
  const closeSettings = useCallback(
    () => setSettingsState((previous) => ({ ...previous, open: false })),
    [setSettingsState],
  );

  const openUpgrade = useCallback(() => setUpgradeOpen(true), [setUpgradeOpen]);
  const openLogout = useCallback(() => setLogoutOpen(true), [setLogoutOpen]);
  const openShortcuts = useCallback(() => openSettings("keyboard"), [openSettings]);

  const confirmLogout = useCallback(() => {
    clearHistory();
    clearUser();
    closeLogout();
  }, [clearHistory, clearUser, closeLogout]);

  return {
    closeUpgrade,
    closeLogout,
    closeSettings,
    openUpgrade,
    openLogout,
    openSettings,
    openShortcuts,
    confirmLogout,
  };
};

const useUserMenuModalValues = ({ state, handlerFns, isPro, user }) => {
  const { upgradeOpen, logoutOpen, settingsState } = state;
  const {
    closeUpgrade,
    closeLogout,
    closeSettings,
    confirmLogout,
    openSettings,
    openShortcuts,
    openUpgrade,
    openLogout,
  } = handlerFns;

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

export const useUserMenuModals = ({ isPro, user, clearUser, clearHistory }) => {
  const state = useUserMenuModalState();
  const handlerFns = useUserMenuModalHandlers(state, { clearHistory, clearUser });
  return useUserMenuModalValues({ state, handlerFns, isPro, user });
};
