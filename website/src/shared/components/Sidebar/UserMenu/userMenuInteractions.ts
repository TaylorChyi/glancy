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
import {
  buildItemViewModels,
  calculateMenuPlacement,
  findNextEnabledIndex,
  isActivationKey,
  isArrowKey,
} from "./userMenuInteractionUtils";

const usePlacementUpdater = ({
  open,
  maxMenuHeight,
  triggerRef,
  menuRef,
  setPlacement,
}: {
  open: boolean;
  maxMenuHeight: number;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  setPlacement: Dispatch<SetStateAction<MenuPlacement>>;
}) =>
  useCallback(() => {
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
  }, [maxMenuHeight, menuRef, open, setPlacement, triggerRef]);

const usePlacementResizeListener = (open: boolean, updatePlacement: () => void) => {
  useEffect(() => {
    if (!open) return undefined;
    updatePlacement();
    const handleResize = () => updatePlacement();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePlacement]);
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

  const updatePlacement = usePlacementUpdater({
    open,
    maxMenuHeight,
    triggerRef,
    menuRef,
    setPlacement,
  });

  usePlacementResizeListener(open, updatePlacement);

  return placement;
};

const useMoveFocus = ({
  items,
  setActiveIndex,
}: {
  items: UserMenuControllerOptions["items"];
  setActiveIndex: Dispatch<SetStateAction<number>>;
}) =>
  useCallback(
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

interface KeyboardEventHandlerOptions {
  items: UserMenuControllerOptions["items"];
  open: boolean;
  activeIndex: number;
  moveFocus: (direction: 1 | -1) => void;
  close: () => void;
}

const createKeyboardEventHandler =
  ({ items, open, activeIndex, moveFocus, close }: KeyboardEventHandlerOptions) =>
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
  const moveFocus = useMoveFocus({
    items,
    setActiveIndex,
  });

  return useMemo(
    () =>
      createKeyboardEventHandler({
        items,
        open,
        activeIndex,
        moveFocus,
        close,
      }),
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
      buildItemViewModels({
        items,
        activeIndex,
        setActiveIndex,
        close,
        setItemRef,
      }),
    [activeIndex, close, items, setActiveIndex, setItemRef],
  );
