import { useRef } from "react";
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

export function useUserMenuController({
  items,
  maxMenuHeight = MENU_MAX_HEIGHT,
}: UserMenuControllerOptions): UserMenuController {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { itemRefs, setItemRef } = useItemRefs();

  const { open, activeIndex, setActiveIndex, toggle, close } = useMenuOpenState(
    {
      items,
      triggerRef,
    },
  );

  useOutsideAndTabGuards({ open, close, rootRef, itemRefs });

  useActiveItemFocus({ open, activeIndex, itemRefs });

  const { placement, handleSurfaceKeyDown } = useUserMenuSurfaceInteractions({
    open,
    items,
    activeIndex,
    setActiveIndex,
    close,
    triggerRef,
    menuRef,
    maxMenuHeight,
  });

  const itemViewModels = useItemViewModels({
    items,
    activeIndex,
    setActiveIndex,
    close,
    setItemRef,
  });

  return {
    open,
    placement,
    rootRef,
    triggerRef,
    menuRef,
    toggle,
    close,
    handleSurfaceKeyDown,
    itemViewModels,
  };
}
