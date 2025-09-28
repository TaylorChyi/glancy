import { memo } from "react";
import PropTypes from "prop-types";
import { useHistory, useLanguage, useUser } from "@/context";
import Avatar from "@/components/ui/Avatar";
import ThemeIcon from "@/components/ui/Icon";
import UserMenuModals from "@/components/Header/UserMenuModals.jsx";
import NavItem from "./NavItem.jsx";
import Popover from "./Popover.jsx";
import { REPORT_FORM_URL, SUPPORT_EMAIL } from "@/config/support.js";
import styles from "./UserDock.module.css";

function AnonymousDock({ t }) {
  return (
    <div className={styles.anonymous}>
      <NavItem icon="arrow-right-on-rectangle" label={t.navLogin} to="/login" />
      <NavItem icon="user" label={t.navRegister} to="/register" />
    </div>
  );
}

AnonymousDock.propTypes = {
  t: PropTypes.object.isRequired,
};

function HelpMenu({ t, onClose, onOpenShortcuts }) {
  const helpLinks = [
    SUPPORT_EMAIL
      ? {
          key: "support-email",
          icon: "email",
          label: t.helpCenter || t.help,
          href: `mailto:${SUPPORT_EMAIL}`,
        }
      : null,
    REPORT_FORM_URL
      ? {
          key: "report",
          icon: "flag",
          label: t.reportBug || t.report,
          href: REPORT_FORM_URL,
          external: true,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className={styles["popover-list"]}>
      {helpLinks.map((link) => (
        <NavItem
          key={link.key}
          icon={link.icon}
          label={link.label}
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noreferrer" : undefined}
          onClick={onClose}
          className={styles["popover-item"]}
        />
      ))}
      <NavItem
        icon="command-line"
        label={t.shortcuts || t.shortcutsTitle}
        onClick={() => {
          onClose();
          onOpenShortcuts();
        }}
        className={styles["popover-item"]}
      />
    </div>
  );
}

HelpMenu.propTypes = {
  t: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenShortcuts: PropTypes.func.isRequired,
};

function AccountMenu({ t, onClose, onUpgrade, onLogout, isPro }) {
  const items = [
    !isPro
      ? {
          key: "upgrade",
          icon: "star-outline",
          label: t.upgrade || "Upgrade",
          onClick: onUpgrade,
        }
      : null,
    {
      key: "logout",
      icon: "arrow-right-on-rectangle",
      label: t.logout || "Logout",
      onClick: onLogout,
    },
  ].filter(Boolean);

  return (
    <div className={styles["popover-list"]}>
      {items.map((item) => (
        <NavItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          onClick={() => {
            onClose();
            item.onClick();
          }}
          className={styles["popover-item"]}
        />
      ))}
    </div>
  );
}

AccountMenu.propTypes = {
  t: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpgrade: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  isPro: PropTypes.bool.isRequired,
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

  return (
    <div className={styles.wrapper}>
      <nav className={styles.actions} aria-label={t.settings}>
        <NavItem
          icon="cog-6-tooth"
          label={t.settings || "Settings"}
          onClick={() => onOpenSettings("general")}
          data-testid="sidebar-action-settings"
        />
        <Popover
          renderTrigger={({ props }) => {
            const { ref, ...rest } = props;
            return (
              <NavItem
                icon="question-mark-circle"
                label={t.help || "Help"}
                ref={ref}
                {...rest}
                data-testid="sidebar-action-help"
              />
            );
          }}
        >
          {({ close }) => (
            <HelpMenu t={t} onClose={close} onOpenShortcuts={onOpenShortcuts} />
          )}
        </Popover>
      </nav>
      <div className={styles["user-dock"]} data-testid="sidebar-user-dock">
        <Avatar width={24} height={24} className={styles.avatar} />
        <div className={styles.meta}>
          <span className={styles.name}>{displayName}</span>
          {planLabel ? <span className={styles.plan}>{planLabel}</span> : null}
        </div>
        <Popover
          renderTrigger={({ props }) => {
            const { ref, ...rest } = props;
            return (
              <button
                type="button"
                className={styles["trigger-button"]}
                ref={ref}
                {...rest}
                aria-label={t.profileTitle || "Account menu"}
              >
                <ThemeIcon name="ellipsis-vertical" width={18} height={18} />
              </button>
            );
          }}
        >
          {({ close }) => (
            <AccountMenu
              t={t}
              onClose={close}
              onUpgrade={onOpenUpgrade}
              onLogout={onOpenLogout}
              isPro={isPro}
            />
          )}
        </Popover>
      </div>
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
