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

const useUserMenuHandlersMemo = ({ openSettings, openShortcuts, openUpgrade, openLogout }) =>
  useMemo(
    () => ({ openSettings, openShortcuts, openUpgrade, openLogout }),
    [openLogout, openSettings, openShortcuts, openUpgrade],
  );

const buildUserMenuModalsState = ({
  closeUpgrade,
  closeLogout,
  closeSettings,
  confirmLogout,
  isPro,
  logoutOpen,
  settingsState,
  upgradeOpen,
  userEmail,
}) => ({
  isPro,
  upgradeOpen,
  closeUpgrade,
  settingsState,
  closeSettings,
  logoutOpen,
  confirmLogout,
  closeLogout,
  email: userEmail ?? "",
});

const buildUserMenuModalDeps = ({
  closeUpgrade,
  closeLogout,
  closeSettings,
  confirmLogout,
  isPro,
  logoutOpen,
  settingsState,
  upgradeOpen,
  userEmail,
}) => [
  closeLogout,
  closeSettings,
  closeUpgrade,
  confirmLogout,
  isPro,
  logoutOpen,
  settingsState,
  upgradeOpen,
  userEmail,
];

const useUserMenuModalsMemo = (props) =>
  useMemo(() => buildUserMenuModalsState(props), buildUserMenuModalDeps(props));

const useUserMenuModalValues = ({ state, handlerFns, isPro, user }) => {
  const { upgradeOpen, logoutOpen, settingsState } = state;
  const { closeUpgrade, closeLogout, closeSettings, confirmLogout } = handlerFns;

  const handlers = useUserMenuHandlersMemo(handlerFns);
  const modals = useUserMenuModalsMemo({
    closeUpgrade,
    closeLogout,
    closeSettings,
    confirmLogout,
    isPro,
    logoutOpen,
    settingsState,
    upgradeOpen,
    userEmail: user?.email,
  });

  return { handlers, modals };
};

export const useUserMenuModals = ({ isPro, user, clearUser, clearHistory }) => {
  const state = useUserMenuModalState();
  const handlerFns = useUserMenuModalHandlers(state, { clearHistory, clearUser });
  return useUserMenuModalValues({ state, handlerFns, isPro, user });
};
