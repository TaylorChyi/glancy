import { memo } from "react";
import styles from "./UserMenu.module.css";
import type { MenuItemViewModel } from "./contracts";
import { MenuItemButton } from "./MenuItemButton";

interface MenuListProps {
  itemViewModels: MenuItemViewModel[];
}

export const MenuList = memo(function MenuList({
  itemViewModels,
}: MenuListProps) {
  return (
    <div className={styles.list}>
      {itemViewModels.map((viewModel) => (
        <MenuItemButton key={viewModel.item.id} viewModel={viewModel} />
      ))}
    </div>
  );
});

export default MenuList;
