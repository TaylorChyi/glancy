import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  MenuItemViewModel,
  MenuPlacement,
  UserMenuControllerOptions,
} from "./contracts";

const getViewportHeight = () =>
  window.innerHeight || document.documentElement.clientHeight;

const getMenuHeight = (
  surfaceNode: HTMLDivElement,
  maxMenuHeight: number,
  viewportHeight: number,
) => Math.min(surfaceNode.scrollHeight, Math.min(viewportHeight * 0.6, maxMenuHeight));

const shouldPlaceMenuDown = (
  spaceAbove: number,
  spaceBelow: number,
  menuHeight: number,
) => spaceAbove < menuHeight && spaceBelow > spaceAbove;

export const calculateMenuPlacement = ({
  triggerRect,
  maxMenuHeight,
  menuRef,
}: {
  triggerRect: DOMRect;
  maxMenuHeight: number;
  menuRef: MutableRefObject<HTMLDivElement | null>;
}): MenuPlacement => {
  const surfaceNode = menuRef.current;
  if (!surfaceNode) return "up";
  const viewportHeight = getViewportHeight();
  const menuHeight = getMenuHeight(surfaceNode, maxMenuHeight, viewportHeight);
  const spaceAbove = triggerRect.top;
  const spaceBelow = viewportHeight - triggerRect.bottom;
  return shouldPlaceMenuDown(spaceAbove, spaceBelow, menuHeight) ? "down" : "up";
};

export const isArrowKey = (key: string): key is "ArrowDown" | "ArrowUp" =>
  key === "ArrowDown" || key === "ArrowUp";

export const isActivationKey = (key: string) => key === "Enter" || key === " ";

interface FindNextEnabledIndexOptions {
  items: UserMenuControllerOptions["items"];
  startIndex: number;
  direction: 1 | -1;
}

export const findNextEnabledIndex = ({
  items,
  startIndex,
  direction,
}: FindNextEnabledIndexOptions) => {
  let next = startIndex;
  for (let i = 0; i < items.length; i += 1) {
    next = (next + direction + items.length) % items.length;
    if (!items[next].disabled) {
      break;
    }
  }
  return next;
};

interface ItemViewModelFactoryOptions {
  items: UserMenuControllerOptions["items"];
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  close: () => void;
  setItemRef: (index: number) => (node: HTMLButtonElement | null) => void;
}

export const buildItemViewModels = ({
  items,
  activeIndex,
  setActiveIndex,
  close,
  setItemRef,
}: ItemViewModelFactoryOptions): MenuItemViewModel[] =>
  items.map((item, index) => {
    const disabled = Boolean(item.disabled);
    const selectItem = () => {
      if (!disabled) {
        item.onSelect();
        close();
      }
    };

    return {
      item,
      disabled,
      isActive: activeIndex === index,
      setNode: setItemRef(index),
      handleFocus: () => setActiveIndex(index),
      handlePointerEnter: () => setActiveIndex(index),
      handleSelect: selectItem,
    };
  });
