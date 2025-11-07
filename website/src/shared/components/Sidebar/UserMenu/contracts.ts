import type {
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
} from "react";


export type MenuPlacement = "up" | "down";

export interface MenuActionItem {
  id: string;
  icon: string;
  label: string;
  description?: string;
  secondaryLabel?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface UserMenuControllerOptions {
  items: MenuActionItem[];
  maxMenuHeight?: number;
}

export interface MenuItemViewModel {
  item: MenuActionItem;
  isActive: boolean;
  disabled: boolean;
  setNode: (node: HTMLButtonElement | null) => void;
  handleFocus: () => void;
  handlePointerEnter: () => void;
  handleSelect: () => void;
}

export interface UserMenuController {
  open: boolean;
  placement: MenuPlacement;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
  handleSurfaceKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  itemViewModels: MenuItemViewModel[];
}
