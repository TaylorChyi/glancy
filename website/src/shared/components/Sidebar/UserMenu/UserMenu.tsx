import { useMemo } from "react";
import UserButton from "./UserButton";
import styles from "./UserMenu.module.css";
import { useUserMenuController } from "./useUserMenuController";
import type { MenuActionItem } from "./contracts";
import { MenuList } from "./MenuList";

interface UserMenuProps {
  displayName: string;
  planLabel?: string;
  labels: {
    settings: string;
    logout: string;
  };
  onOpenSettings: (section?: string) => void;
  onOpenLogout: () => void;
}

const buildMenuItems = ({
  settingsLabel,
  logoutLabel,
  onOpenSettings,
  onOpenLogout,
}: {
  settingsLabel: string;
  logoutLabel: string;
  onOpenSettings: (section?: string) => void;
  onOpenLogout: () => void;
}): MenuActionItem[] => [
  {
    id: "settings",
    icon: "cog-6-tooth",
    label: settingsLabel,
    onSelect: () => onOpenSettings("general"),
  },
  {
    id: "logout",
    icon: "arrow-right-on-rectangle",
    label: logoutLabel,
    onSelect: onOpenLogout,
  },
];


function UserMenu({
  displayName,
  planLabel,
  labels,
  onOpenSettings,
  onOpenLogout,
}: UserMenuProps) {
  const menuItems = useMemo(
    () =>
      buildMenuItems({
        settingsLabel: labels.settings,
        logoutLabel: labels.logout,
        onOpenSettings,
        onOpenLogout,
      }),
    [labels.logout, labels.settings, onOpenLogout, onOpenSettings],
  );

  const {
    open,
    placement,
    rootRef,
    triggerRef,
    menuRef,
    toggle,
    handleSurfaceKeyDown,
    itemViewModels,
  } = useUserMenuController({ items: menuItems });

  return (
    <div ref={rootRef} className={styles.root} data-open={open}>
      <UserButton
        ref={triggerRef}
        displayName={displayName}
        planLabel={planLabel}
        onToggle={toggle}
        open={open}
      />
      <div
        ref={menuRef}
        className={styles.surface}
        data-open={open}
        data-placement={placement === "down" ? "down" : undefined}
        role="menu"
        aria-hidden={!open}
        tabIndex={-1}
        onKeyDown={handleSurfaceKeyDown}
      >
        <MenuList itemViewModels={itemViewModels} />
      </div>
    </div>
  );
}

export default UserMenu;
