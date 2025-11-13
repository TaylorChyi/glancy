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

const focusTriggerWhenClosing = (
  previousOpen: boolean,
  open: boolean,
  triggerRef: MutableRefObject<HTMLButtonElement | null>,
) => {
  if (previousOpen && !open) {
    triggerRef.current?.focus();
  }
};

const resetActiveIndexIfNeeded = ({
  open,
  items,
  setActiveIndex,
}: {
  open: boolean;
  items: UserMenuControllerOptions["items"];
  setActiveIndex: (index: number) => void;
}) => {
  if (!open) {
    setActiveIndex(findFirstEnabledIndex(items));
  }
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
    resetActiveIndexIfNeeded({ open, items, setActiveIndex });
  }, [items, open]);

  const previousOpenRef = useRef(open);
  useEffect(() => {
    focusTriggerWhenClosing(previousOpenRef.current, open, triggerRef);
    previousOpenRef.current = open;
  }, [open, triggerRef]);

  return { open, activeIndex, setActiveIndex, toggle, close };
};

const isEscapeKey = (event: KeyboardEvent) => event.key === "Escape";
const isTabKey = (event: KeyboardEvent) => event.key === "Tab";

const filterFocusableItems = (
  itemRefs: MutableRefObject<Array<HTMLButtonElement | null>>,
) => itemRefs.current.filter((node): node is HTMLButtonElement => Boolean(node));

const cycleFocus = ({
  focusables,
  current,
  direction,
}: {
  focusables: HTMLButtonElement[];
  current: HTMLElement | null;
  direction: 1 | -1;
}) => {
  const currentIndex = current ? focusables.indexOf(current as HTMLButtonElement) : -1;
  if (focusables.length === 0) return;
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + direction + focusables.length) % focusables.length;
  focusables[nextIndex].focus();
};

const handleTabWithinMenu = ({
  event,
  itemRefs,
}: {
  event: KeyboardEvent;
  itemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
}) => {
  const focusables = filterFocusableItems(itemRefs);
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }
  cycleFocus({
    focusables,
    current: document.activeElement as HTMLElement | null,
    direction: event.shiftKey ? -1 : 1,
  });
  event.preventDefault();
};

const createOutsidePointerHandler = ({
  close,
  rootRef,
}: {
  close: () => void;
  rootRef: MutableRefObject<HTMLDivElement | null>;
}) =>
  function handlePointerDown(event: MouseEvent) {
    const rootNode = rootRef.current;
    if (!rootNode) return;
    if (!rootNode.contains(event.target as Node)) {
      close();
    }
  };

const createKeydownHandler = ({
  close,
  itemRefs,
}: {
  close: () => void;
  itemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
}) =>
  function handleKeyDown(event: KeyboardEvent) {
    if (isEscapeKey(event)) {
      event.preventDefault();
      close();
      return;
    }

    if (!isTabKey(event)) return;
    handleTabWithinMenu({ event, itemRefs });
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

    const handlePointerDown = createOutsidePointerHandler({ close, rootRef });
    const handleKeyDown = createKeydownHandler({ close, itemRefs });

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
