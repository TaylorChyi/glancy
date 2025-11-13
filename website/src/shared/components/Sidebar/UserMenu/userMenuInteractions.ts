import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
  SetStateAction,
} from "react";
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

export const usePlacement = ({
  open,
  maxMenuHeight,
  triggerRef,
  menuRef,
}: {
  open: boolean;
  maxMenuHeight: number;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
}) => {
  const [placement, setPlacement] = useState<MenuPlacement>("up");

  const updatePlacement = useCallback(() => {
    if (!open) return;
    const triggerNode = triggerRef.current;
    if (!triggerNode) return;
    const triggerRect = triggerNode.getBoundingClientRect();
    setPlacement(
      calculateMenuPlacement({
        triggerRect,
        maxMenuHeight,
        menuRef,
      }),
    );
  }, [maxMenuHeight, menuRef, open, triggerRef]);

  useEffect(() => {
    if (!open) return undefined;
    updatePlacement();
    const handleResize = () => updatePlacement();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePlacement]);

  return placement;
};

const isArrowKey = (key: string): key is "ArrowDown" | "ArrowUp" =>
  key === "ArrowDown" || key === "ArrowUp";

const isActivationKey = (key: string) => key === "Enter" || key === " ";

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

export const useKeyboardHandlers = ({
  items,
  open,
  activeIndex,
  setActiveIndex,
  close,
}: {
  items: UserMenuControllerOptions["items"];
  open: boolean;
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  close: () => void;
}) => {
  const moveFocus = useCallback(
    (direction: 1 | -1) => {
      if (items.length === 0) return;
      setActiveIndex((previous) =>
        findNextEnabledIndex({
          items,
          startIndex: previous,
          direction,
        }),
      );
    },
    [items, setActiveIndex],
  );

  return useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!open) return;
      const currentItem = items[activeIndex];
      if (!currentItem) return;

      if (isArrowKey(event.key)) {
        event.preventDefault();
        moveFocus(event.key === "ArrowDown" ? 1 : -1);
        return;
      }

      if (!isActivationKey(event.key)) return;
      event.preventDefault();
      if (!currentItem.disabled) {
        currentItem.onSelect();
        close();
      }
    },
    [activeIndex, close, items, moveFocus, open],
  );
};

export const useItemViewModels = ({
  items,
  activeIndex,
  setActiveIndex,
  close,
  setItemRef,
}: {
  items: UserMenuControllerOptions["items"];
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  close: () => void;
  setItemRef: (index: number) => (node: HTMLButtonElement | null) => void;
}) =>
  useMemo<MenuItemViewModel[]>(
    () =>
      items.map((item, index) => {
        const disabled = Boolean(item.disabled);
        return {
          item,
          disabled,
          isActive: activeIndex === index,
          setNode: setItemRef(index),
          handleFocus: () => setActiveIndex(index),
          handlePointerEnter: () => setActiveIndex(index),
          handleSelect: () => {
            if (!disabled) {
              item.onSelect();
              close();
            }
          },
        };
      }),
    [activeIndex, close, items, setActiveIndex, setItemRef],
  );
