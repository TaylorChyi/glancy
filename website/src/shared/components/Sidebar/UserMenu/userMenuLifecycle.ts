import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { UserMenuControllerOptions } from "./contracts";

/**
 * 背景：
 *  - 用户菜单的开合与焦点管理此前耦合在主组件中，难以独立测试与复用。
 * 目的：
 *  - 提供围绕开合状态、外部点击守卫与焦点回收的基础 Hook，支撑控制器重构。
 * 关键决策与取舍：
 *  - 保留命令式 ref 以兼容原有焦点策略；
 *  - 将默认聚焦逻辑放入 effect，避免渲染期副作用。
 * 影响范围：
 *  - 仅限 Sidebar UserMenu 内部使用。
 * 演进与TODO：
 *  - 若未来支持多触发器，可在此扩展上下文感知能力。
 */
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
