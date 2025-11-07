import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { UserMenuControllerOptions } from "./contracts";


export const findFirstEnabledIndex = (
  items: UserMenuControllerOptions["items"],
) => {
  if (items.length === 0) return 0;
  const firstEnabled = items.findIndex((item) => !item.disabled);
  return firstEnabled >= 0 ? firstEnabled : 0;
};

export const useItemRefs = () => {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const setItemRef = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      itemRefs.current[index] = node;
    },
    [],
  );
  return { itemRefs, setItemRef };
};

export const useMenuOpenState = ({
  items,
  triggerRef,
}: {
  items: UserMenuControllerOptions["items"];
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    findFirstEnabledIndex(items),
  );
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    setActiveIndex(findFirstEnabledIndex(items));
    setOpen(true);
  }, [close, items, open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(findFirstEnabledIndex(items));
    }
  }, [items, open]);

  const previousOpenRef = useRef(open);
  useEffect(() => {
    if (previousOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    previousOpenRef.current = open;
  }, [open, triggerRef]);

  return { open, activeIndex, setActiveIndex, toggle, close };
};

export const useOutsideAndTabGuards = ({
  open,
  close,
  rootRef,
  itemRefs,
}: {
  open: boolean;
  close: () => void;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  itemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const rootNode = rootRef.current;
      if (!rootNode) return;
      if (!rootNode.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "Tab") {
        const focusables = itemRefs.current.filter(
          (node): node is HTMLButtonElement => Boolean(node),
        );
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const currentNode = document.activeElement as HTMLElement | null;
        const currentIndex = currentNode
          ? focusables.indexOf(currentNode as HTMLButtonElement)
          : -1;
        const delta = event.shiftKey ? -1 : 1;
        const nextIndex =
          currentIndex === -1
            ? 0
            : (currentIndex + delta + focusables.length) % focusables.length;
        focusables[nextIndex].focus();
        event.preventDefault();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, itemRefs, open, rootRef]);
};

export const useActiveItemFocus = ({
  open,
  activeIndex,
  itemRefs,
}: {
  open: boolean;
  activeIndex: number;
  itemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
}) => {
  useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, itemRefs, open]);
};
