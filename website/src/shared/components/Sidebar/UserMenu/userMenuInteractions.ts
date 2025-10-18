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

/**
 * 背景：
 *  - 与用户菜单相关的键盘导航与浮层定位需要在多个组件间共享。
 * 目的：
 *  - 输出纯交互 Hook，协助控制器组合并保持函数体积可控。
 * 关键决策与取舍：
 *  - 定位逻辑延续原先的视窗高度策略，避免布局回归风险；
 *  - 键盘处理保持无障碍快捷键约定。
 * 影响范围：
 *  - UserMenu 控制器内部。
 * 演进与TODO：
 *  - 后续若引入分组渲染，可在视图模型生成器中扩展层级信息。
 */
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
    const surfaceNode = menuRef.current;
    if (!triggerNode || !surfaceNode) return;
    const triggerRect = triggerNode.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const menuHeight = Math.min(
      surfaceNode.scrollHeight,
      Math.min(viewportHeight * 0.6, maxMenuHeight),
    );
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    setPlacement(spaceAbove < menuHeight && spaceBelow > spaceAbove ? "down" : "up");
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
      setActiveIndex((previous) => {
        let next = previous;
        for (let i = 0; i < items.length; i += 1) {
          next = (next + direction + items.length) % items.length;
          if (!items[next].disabled) break;
        }
        return next;
      });
    },
    [items, setActiveIndex],
  );

  return useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!open) return;
      const currentItem = items[activeIndex];
      if (!currentItem) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(-1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!currentItem.disabled) {
          currentItem.onSelect();
          close();
        }
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
