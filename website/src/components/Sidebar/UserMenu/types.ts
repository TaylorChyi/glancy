export type MenuItemAction = {
  id: string;
  icon?: string;
  label: string;
  secondary?: string;
  description?: string;
  onSelect?: () => void;
  href?: string;
  target?: string;
  submenu?: "help";
  disabled?: boolean;
};

export type MenuEntry =
  | { type: "profile"; id: string; name: string; plan?: string | null }
  | { type: "groupLabel"; id: string; label: string }
  | { type: "divider"; id: string }
  | ({ type: "item" } & MenuItemAction);

export type SubmenuItem = {
  id: string;
  icon?: string;
  label: string;
  secondary?: string;
  onSelect?: () => void;
  href?: string;
  target?: string;
};

export type SubmenuState = {
  id: string;
  anchorTop: number;
  items: SubmenuItem[];
  side: "above" | "below";
};
