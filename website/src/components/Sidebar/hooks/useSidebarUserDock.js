/**
 * 背景：
 *  - 侧边栏用户区域此前直接在容器组件内读取多个 Context，导致派生状态与展示耦合。
 * 目的：
 *  - 聚合用户、历史、语言上下文并输出组合模式所需的派生数据与回调映射，保持容器纯粹。
 * 关键决策与取舍：
 *  - 采用组合模式（UserMenuModals + 展示组件）承载模态控制，比在 Hook 内直接触发副作用更易扩展装饰器；
 *  - 放弃 useReducer 等状态机方案，因当前仅为静态派生值与回调封装，无需额外状态管理。
 * 影响范围：
 *  - UserDock 容器改为依赖本 Hook 暴露的协议；展示组件与其它模块无需改动即可复用。
 * 演进与TODO：
 *  - 可在 modalProps 中挂载特性开关或埋点；匿名导航后续可支持多语言路由策略。
 */
import { useCallback, useMemo } from "react";
import { useHistory, useLanguage, useUser } from "@/context";

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
      help: t.help || "Help",
      helpSection: t.support || t.helpSection || undefined,
      settings: t.settings || "Settings",
      shortcuts: t.shortcuts || t.shortcutsTitle || "Keyboard shortcuts",
      shortcutsDescription: t.shortcutsDescription || undefined,
      upgrade: !isPro ? t.upgrade || "Upgrade" : undefined,
      logout: t.logout || "Logout",
      accountSection: t.profileTitle || t.account || "Account",
      helpCenter: t.helpCenter || t.help,
      releaseNotes: t.releaseNotes || "Release notes",
      termsPolicies: t.termsPolicies || "Terms & policies",
      reportBug: t.reportBug || t.report || "Report an issue",
      downloadApps: t.downloadApps || "Download apps",
    }),
    [isPro, t],
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
      isPro,
    }),
    [displayName, isPro, labels, planLabel],
  );

  const buildAuthenticatedProps = useCallback(
    ({ openSettings, openShortcuts, openUpgrade, openLogout }) => ({
      ...authenticatedBaseProps,
      onOpenSettings: openSettings,
      onOpenShortcuts: openShortcuts,
      onOpenUpgrade: openUpgrade,
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
