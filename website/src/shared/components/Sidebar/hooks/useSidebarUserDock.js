import { useCallback, useMemo } from "react";
import { useHistory, useLanguage, useUser } from "@core/context";

export function useSidebarUserDock() {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();

  const hasUser = Boolean(user);

  const isPro = useMemo(() => {
    if (!user) {
      return false;
    }

    if (user.member || user.isPro) {
      return true;
    }

    if (user.plan && user.plan !== "free") {
      return true;
    }

    return false;
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) {
      return "";
    }

    return user.username || user.email || "";
  }, [user]);

  const planLabel = useMemo(() => {
    if (!user && !isPro) {
      return "";
    }

    const planName = user?.plan || (isPro ? "plus" : "free");

    if (!planName) {
      return "";
    }

    return planName.charAt(0).toUpperCase() + planName.slice(1);
  }, [isPro, user]);

  const labels = useMemo(
    () => ({
      settings: t.settings || "Settings",
      logout: t.logout || "Logout",
    }),
    [t],
  );

  const anonymousNav = useMemo(
    () => ({
      login: {
        icon: "arrow-right-on-rectangle",
        label: t.navLogin || "Log in",
        to: "/login",
      },
      register: {
        icon: "user",
        label: t.navRegister || "Register",
        to: "/register",
      },
    }),
    [t],
  );

  const modalProps = useMemo(
    () => ({
      isPro,
      user,
      clearUser,
      clearHistory,
    }),
    [clearHistory, clearUser, isPro, user],
  );

  const authenticatedBaseProps = useMemo(
    () => ({
      displayName,
      planLabel,
      labels,
    }),
    [displayName, labels, planLabel],
  );

  const buildAuthenticatedProps = useCallback(
    ({ openSettings, openLogout }) => ({
      ...authenticatedBaseProps,
      onOpenSettings: openSettings,
      onOpenLogout: openLogout,
    }),
    [authenticatedBaseProps],
  );

  return {
    hasUser,
    anonymousNav,
    modalProps,
    buildAuthenticatedProps,
  };
}

export default useSidebarUserDock;
