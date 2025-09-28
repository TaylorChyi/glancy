import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import { useHistory, useLanguage, useUser } from "@/context";
import UserMenuModals from "@/components/Header/UserMenuModals.jsx";
import NavItem from "./NavItem.jsx";
import UserMenu from "./UserMenu";
import styles from "./UserDock.module.css";

function AnonymousDock({ t }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.anonymous}>
        <NavItem
          icon="arrow-right-on-rectangle"
          label={t.navLogin}
          to="/login"
        />
        <NavItem icon="user" label={t.navRegister} to="/register" />
      </div>
    </div>
  );
}

AnonymousDock.propTypes = {
  t: PropTypes.object.isRequired,
};

function AuthenticatedDock({
  user,
  t,
  isPro,
  onOpenSettings,
  onOpenShortcuts,
  onOpenUpgrade,
  onOpenLogout,
}) {
  const displayName = user?.username || user?.email || "";
  const planName = user?.plan || (isPro ? "plus" : "free");
  const planLabel = planName
    ? planName.charAt(0).toUpperCase() + planName.slice(1)
    : "";

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
      supportEmail: t.helpCenter || t.help,
      report: t.reportBug || t.report,
    }),
    [isPro, t],
  );

  return (
    <div className={styles.wrapper} data-testid="sidebar-user-dock">
      <UserMenu
        displayName={displayName}
        planLabel={planLabel}
        labels={labels}
        isPro={isPro}
        onOpenSettings={onOpenSettings}
        onOpenShortcuts={onOpenShortcuts}
        onOpenUpgrade={onOpenUpgrade}
        onOpenLogout={onOpenLogout}
      />
    </div>
  );
}

AuthenticatedDock.propTypes = {
  user: PropTypes.object.isRequired,
  t: PropTypes.object.isRequired,
  isPro: PropTypes.bool.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onOpenShortcuts: PropTypes.func.isRequired,
  onOpenUpgrade: PropTypes.func.isRequired,
  onOpenLogout: PropTypes.func.isRequired,
};

function UserDock() {
  const { user, clearUser } = useUser();
  const { clearHistory } = useHistory();
  const { t } = useLanguage();

  if (!user) {
    return <AnonymousDock t={t} />;
  }

  const isPro =
    user?.member || user?.isPro || (user?.plan && user.plan !== "free");

  return (
    <UserMenuModals
      isPro={isPro}
      user={user}
      clearUser={clearUser}
      clearHistory={clearHistory}
    >
      {({ openSettings, openShortcuts, openUpgrade, openLogout }) => (
        <AuthenticatedDock
          user={user}
          t={t}
          isPro={isPro}
          onOpenSettings={openSettings}
          onOpenShortcuts={openShortcuts}
          onOpenUpgrade={openUpgrade}
          onOpenLogout={openLogout}
        />
      )}
    </UserMenuModals>
  );
}

export default memo(UserDock);
