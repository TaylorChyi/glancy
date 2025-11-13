import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./UserMenu.module.css";
import type { MenuItemViewModel } from "./contracts";

interface MenuItemButtonProps {
  viewModel: MenuItemViewModel;
}

export function MenuItemButton({
  viewModel: {
    item,
    isActive,
    disabled,
    setNode,
    handleFocus,
    handlePointerEnter,
    handleSelect,
  },
}: MenuItemButtonProps) {
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

export default MenuItemButton;
