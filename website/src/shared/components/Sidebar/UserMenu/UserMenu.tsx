import { useMemo } from "react";
import UserButton from "./UserButton";
import styles from "./UserMenu.module.css";
import { useUserMenuController } from "./useUserMenuController";
import type { MenuActionItem, UserMenuController } from "./contracts";
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

function useMenuItems({
  labels,
  onOpenSettings,
  onOpenLogout,
}: {
  labels: UserMenuProps["labels"];
  onOpenSettings: UserMenuProps["onOpenSettings"];
  onOpenLogout: UserMenuProps["onOpenLogout"];
}) {
  return useMemo(
    () =>
      buildMenuItems({
        settingsLabel: labels.settings,
        logoutLabel: labels.logout,
        onOpenSettings,
        onOpenLogout,
      }),
    [labels.logout, labels.settings, onOpenLogout, onOpenSettings],
  );
}

function UserMenu({
  displayName,
  planLabel,
  labels,
  onOpenSettings,
  onOpenLogout,
}: UserMenuProps) {
  const menuItems = useMenuItems({ labels, onOpenSettings, onOpenLogout });
  const controller = useUserMenuController({ items: menuItems });

  return (
    <div ref={controller.rootRef} className={styles.root} data-open={controller.open}>
      <UserButton
        ref={controller.triggerRef}
        displayName={displayName}
        planLabel={planLabel}
        onToggle={controller.toggle}
        open={controller.open}
      />
      <MenuSurface controller={controller} />
    </div>
  );
}

interface MenuSurfaceProps {
  controller: UserMenuController;
}

function MenuSurface({ controller }: MenuSurfaceProps) {
  return (
    <div
      ref={controller.menuRef}
      className={styles.surface}
      data-open={controller.open}
      data-placement={controller.placement === "down" ? "down" : undefined}
      role="menu"
      aria-hidden={!controller.open}
      tabIndex={-1}
      onKeyDown={controller.handleSurfaceKeyDown}
    >
      <MenuList itemViewModels={controller.itemViewModels} />
    </div>
  );
}

export default UserMenu;
