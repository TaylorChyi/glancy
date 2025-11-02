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
import {
  useItemViewModels,
  useKeyboardHandlers,
  usePlacement,
} from "./userMenuInteractions";

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

  const placement = usePlacement({
    open,
    maxMenuHeight,
    triggerRef,
    menuRef,
  });

  useActiveItemFocus({ open, activeIndex, itemRefs });

  const handleSurfaceKeyDown = useKeyboardHandlers({
    items,
    open,
    activeIndex,
    setActiveIndex,
    close,
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
    handleSurfaceKeyDown,
    itemViewModels,
  };
}
