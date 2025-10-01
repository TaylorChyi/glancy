export type MenuBaseItem = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  secondaryLabel?: string;
  disabled?: boolean;
};

export type MenuActionItem = MenuBaseItem & {
  kind: "action";
  onSelect: () => void;
};

export type SubmenuLinkItem = {
  id: string;
  icon: string;
  label: string;
  href?: string;
  external?: boolean;
  onSelect?: () => void;
};

export type MenuSubmenuItem = MenuBaseItem & {
  kind: "submenu";
  items: SubmenuLinkItem[];
};

export type MenuItem = MenuActionItem | MenuSubmenuItem;
