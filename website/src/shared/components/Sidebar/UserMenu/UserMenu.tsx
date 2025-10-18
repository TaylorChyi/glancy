import { useMemo } from "react";
import ThemeIcon from "@shared/components/ui/Icon";
import UserButton from "./UserButton";
import styles from "./UserMenu.module.css";
import { useUserMenuController } from "./useUserMenuController";
import type { MenuActionItem, MenuItemViewModel } from "./contracts";

interface MenuListProps {
  itemViewModels: MenuItemViewModel[];
}

function MenuItemButton({
  viewModel: {
    item,
    isActive,
    disabled,
    setNode,
    handleFocus,
    handlePointerEnter,
    handleSelect,
  },
}: {
  viewModel: MenuItemViewModel;
}) {
  return (
    <button
      type="button"
      ref={setNode}
      className={styles["menu-item"]}
      data-active={isActive || undefined}
      role="menuitem"
      tabIndex={isActive ? 0 : -1}
      onFocus={handleFocus}
      onPointerEnter={handlePointerEnter}
      onClick={handleSelect}
      aria-disabled={disabled || undefined}
    >
      <span className={styles.icon}>
        <ThemeIcon name={item.icon} width={18} height={18} />
      </span>
      <span className={styles.labels}>
        <span className={styles["primary-label"]}>{item.label}</span>
        {item.description ? (
          <span className={styles["secondary-label"]}>{item.description}</span>
        ) : null}
      </span>
      {item.secondaryLabel ? (
        <span className={styles["meta-label"]}>{item.secondaryLabel}</span>
      ) : null}
    </button>
  );
}

function MenuList({ itemViewModels }: MenuListProps) {
  return (
    <div className={styles.list}>
      {itemViewModels.map((viewModel) => (
        <MenuItemButton key={viewModel.item.id} viewModel={viewModel} />
      ))}
    </div>
  );
}

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

/**
 * 背景：
 *  - 帮助入口及子菜单被下线后，原有的多级菜单机制与调度逻辑成为冗余负担。
 * 目的：
 *  - 以纯动作列表呈现用户菜单，仅保留设置与退出等核心操作，降低未来维护成本。
 * 关键决策与取舍：
 *  - 采用控制器 Hook 承载状态管理，使组件专注渲染逻辑；
 *  - 保留数组驱动的配置方式以兼容未来新增操作项。
 * 影响范围：
 *  - Sidebar 登录态用户菜单，UserSubmenu 组件同步下线。
 * 演进与TODO：
 *  - 若后续需要重新引入分组或多级结构，可在控制器 Hook 上扩展视图模型以恢复子菜单能力。
 */
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
