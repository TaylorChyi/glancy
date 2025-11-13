import { useRef } from "react";
import type { MutableRefObject } from "react";
import type {
  UserMenuController,
  UserMenuControllerOptions,
} from "./contracts";
import {
  useActiveItemFocus,
  useItemRefs,
  useMenuOpenState,
  useOutsideAndTabGuards,
} from "./userMenuLifecycle";
import { useItemViewModels } from "./userMenuInteractions";
import { useUserMenuSurfaceInteractions } from "./useUserMenuSurfaceInteractions";

const MENU_MAX_HEIGHT = 420;

interface OpenState {
  rootRef: MutableRefObject<HTMLDivElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  open: boolean;
  activeIndex: number;
  setActiveIndex: ReturnType<typeof useMenuOpenState>["setActiveIndex"];
  toggle: ReturnType<typeof useMenuOpenState>["toggle"];
  close: ReturnType<typeof useMenuOpenState>["close"];
  setItemRef: ReturnType<typeof useItemRefs>["setItemRef"];
}

function useUserMenuOpenStateController({
  items,
}: Pick<UserMenuControllerOptions, "items">): OpenState {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { itemRefs, setItemRef } = useItemRefs();

  const { open, activeIndex, setActiveIndex, toggle, close } = useMenuOpenState({
    items,
    triggerRef,
  });

  useOutsideAndTabGuards({ open, close, rootRef, itemRefs });
  useActiveItemFocus({ open, activeIndex, itemRefs });

  return {
    rootRef,
    menuRef,
    triggerRef,
    open,
    activeIndex,
    setActiveIndex,
    toggle,
    close,
    setItemRef,
  };
}

function useUserMenuSurfaceController({
  items,
  maxMenuHeight,
  openState,
}: {
  items: UserMenuControllerOptions["items"];
  maxMenuHeight: number;
  openState: OpenState;
}) {
  return useUserMenuSurfaceInteractions({
    items,
    maxMenuHeight,
    open: openState.open,
    activeIndex: openState.activeIndex,
    setActiveIndex: openState.setActiveIndex,
    close: openState.close,
    triggerRef: openState.triggerRef,
    menuRef: openState.menuRef,
  });
}

function useUserMenuItemViewModels({
  items,
  openState,
}: {
  items: UserMenuControllerOptions["items"];
  openState: OpenState;
}) {
  return useItemViewModels({
    items,
    activeIndex: openState.activeIndex,
    setActiveIndex: openState.setActiveIndex,
    close: openState.close,
    setItemRef: openState.setItemRef,
  });
}

export function useUserMenuController({
  items,
  maxMenuHeight = MENU_MAX_HEIGHT,
}: UserMenuControllerOptions): UserMenuController {
  const openState = useUserMenuOpenStateController({ items });
  const { placement, handleSurfaceKeyDown } = useUserMenuSurfaceController({
    items,
    maxMenuHeight,
    openState,
  });
  const itemViewModels = useUserMenuItemViewModels({ items, openState });

  return {
    open: openState.open,
    placement,
    rootRef: openState.rootRef,
    triggerRef: openState.triggerRef,
    menuRef: openState.menuRef,
    toggle: openState.toggle,
    close: openState.close,
    handleSurfaceKeyDown,
    itemViewModels,
  };
}
