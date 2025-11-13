import { useCallback, useMemo } from "react";
import { useHistory, useLanguage, useUser } from "@core/context";

const formatPlanName = (planName) => {
  const safePlanName = String(planName);
  return safePlanName.charAt(0).toUpperCase() + safePlanName.slice(1);
};

export const useIsUserPro = (user) =>
  useMemo(() => {
    if (!user) return false;
    if (user.member || user.isPro) return true;
    if (user.plan && user.plan !== "free") return true;
    return false;
  }, [user]);

export const useUserDisplayName = (user) =>
  useMemo(() => {
    if (!user) return "";
    return user.username || user.email || "";
  }, [user]);

export const useUserPlanLabel = ({ user, isPro }) =>
  useMemo(() => {
    if (!user && !isPro) {
      return "";
    }

    const planName = user?.plan || (isPro ? "plus" : "free");

    if (!planName) {
      return "";
    }

    return formatPlanName(planName);
  }, [isPro, user]);

export const useDockLabels = (t) =>
  useMemo(
    () => ({
      settings: t.settings || "Settings",
      logout: t.logout || "Logout",
    }),
    [t],
  );

export const useAnonymousNav = (t) =>
  useMemo(
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

export const useUserModalProps = ({
  user,
  isPro,
  clearUser,
  clearHistory,
}) =>
  useMemo(
    () => ({
      isPro,
      user,
      clearUser,
      clearHistory,
    }),
    [clearHistory, clearUser, isPro, user],
  );

export const useAuthenticatedBaseProps = ({
  displayName,
  planLabel,
  labels,
}) =>
  useMemo(
    () => ({
      displayName,
      planLabel,
      labels,
    }),
    [displayName, labels, planLabel],
  );

export const useAuthenticatedPropsBuilder = (authenticatedBaseProps) =>
  useCallback(
    ({ openSettings, openLogout }) => ({
      ...authenticatedBaseProps,
      onOpenSettings: openSettings,
      onOpenLogout: openLogout,
    }),
    [authenticatedBaseProps],
  );

export function useSidebarUserDock() {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();

  const isPro = useIsUserPro(user);
  const displayName = useUserDisplayName(user);
  const planLabel = useUserPlanLabel({ user, isPro });
  const labels = useDockLabels(t);
  const anonymousNav = useAnonymousNav(t);

  const modalProps = useUserModalProps({
    user,
    isPro,
    clearUser,
    clearHistory,
  });

  const authenticatedBaseProps = useAuthenticatedBaseProps({
    displayName,
    planLabel,
    labels,
  });

  const buildAuthenticatedProps = useAuthenticatedPropsBuilder(
    authenticatedBaseProps,
  );

  return {
    hasUser: Boolean(user),
    anonymousNav,
    modalProps,
    buildAuthenticatedProps,
  };
}

export default useSidebarUserDock;
