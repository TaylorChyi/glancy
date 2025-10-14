import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import ThemeIcon from "@shared/components/ui/Icon";
import UserButton from "./UserButton";
import styles from "./UserMenu.module.css";

interface UserMenuProps {
  displayName: string;
  planLabel?: string;
  labels: {
    settings: string;
    logout: string;
  };
  onOpenSettings: (section?: string) => void;
  onOpenLogout: () => void;
}

type MenuActionItem = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  secondaryLabel?: string;
  disabled?: boolean;
  onSelect: () => void;
};

const MENU_MAX_HEIGHT = 420;

/**
 * 背景：
 *  - 帮助入口及子菜单被下线后，原有的多级菜单机制与调度逻辑成为冗余负担。
 * 目的：
 *  - 以纯动作列表呈现用户菜单，仅保留设置与退出等核心操作，降低未来维护成本。
 * 关键决策与取舍：
 *  - 仍通过数组配置驱动菜单项，保留组合弹性；放弃子菜单组件以消除空转状态与定时器管理。
 * 影响范围：
 *  - Sidebar 登录态用户菜单，UserSubmenu 组件同步下线。
 * 演进与TODO：
 *  - 若后续需要重新引入分组或多级结构，可在此基础上抽象渲染器并通过特性开关恢复子菜单能力。
 */
function UserMenu({
  displayName,
  planLabel,
  labels,
  onOpenSettings,
  onOpenLogout,
}: UserMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<"up" | "down">("up");
  const { settings, logout } = labels;

  const menuItems = useMemo<MenuActionItem[]>(
    () => [
      {
        id: "settings",
        icon: "cog-6-tooth",
        label: settings,
        onSelect: () => onOpenSettings("general"),
      },
      {
        id: "logout",
        icon: "arrow-right-on-rectangle",
        label: logout,
        onSelect: onOpenLogout,
      },
    ],
    [logout, onOpenLogout, onOpenSettings, settings],
  );

  const interactiveItems = menuItems;

  const computeDefaultIndex = useCallback(() => {
    if (interactiveItems.length === 0) return 0;
    const firstEnabled = interactiveItems.findIndex((item) => !item.disabled);
    return firstEnabled >= 0 ? firstEnabled : 0;
  }, [interactiveItems]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    setActiveIndex(computeDefaultIndex());
    setOpen(true);
  }, [closeMenu, computeDefaultIndex, open]);

  const previousOpenRef = useRef(open);
  useEffect(() => {
    if (previousOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    previousOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const rootNode = rootRef.current;
      if (!rootNode) return;
      if (!rootNode.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
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
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;
    const current = itemRefs.current[activeIndex];
    if (current) {
      current.focus();
    }
  }, [activeIndex, open]);

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
      Math.min(viewportHeight * 0.6, MENU_MAX_HEIGHT),
    );
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    if (spaceAbove < menuHeight && spaceBelow > spaceAbove) {
      setPlacement("down");
    } else {
      setPlacement("up");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    updatePlacement();
    const handleResize = () => {
      updatePlacement();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePlacement]);

  const moveFocus = useCallback(
    (direction: 1 | -1) => {
      if (interactiveItems.length === 0) return;
      setActiveIndex((previous) => {
        let next = previous;
        for (let i = 0; i < interactiveItems.length; i += 1) {
          next =
            (next + direction + interactiveItems.length) %
            interactiveItems.length;
          if (!interactiveItems[next].disabled) {
            break;
          }
        }
        return next;
      });
    },
    [interactiveItems],
  );

  const handleMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!open) return;
      const currentItem = interactiveItems[activeIndex];
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
          closeMenu();
        }
      }
    },
    [activeIndex, closeMenu, interactiveItems, moveFocus, open],
  );

  const setItemRef = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      itemRefs.current[index] = node;
    },
    [],
  );

  return (
    <div ref={rootRef} className={styles.root} data-open={open}>
      <UserButton
        ref={triggerRef}
        displayName={displayName}
        planLabel={planLabel}
        onToggle={handleToggle}
        open={open}
      />
      <div
        ref={menuRef}
        className={styles.surface}
        data-open={open}
        data-placement={placement === "down" ? "down" : undefined}
        role="menu"
        aria-hidden={!open}
        tabIndex={-1}
        onKeyDown={handleMenuKeyDown}
      >
        <div className={styles.list}>
          {interactiveItems.map((item, interactiveIndex) => {
            const isActive = activeIndex === interactiveIndex;

            return (
              <button
                key={item.id}
                type="button"
                ref={setItemRef(interactiveIndex)}
                className={styles["menu-item"]}
                data-active={isActive || undefined}
                role="menuitem"
                tabIndex={isActive ? 0 : -1}
                onFocus={() => {
                  setActiveIndex(interactiveIndex);
                }}
                onPointerEnter={() => {
                  setActiveIndex(interactiveIndex);
                }}
                onClick={() => {
                  if (!item.disabled) {
                    item.onSelect();
                    closeMenu();
                  }
                }}
                aria-disabled={item.disabled || undefined}
              >
                <span className={styles.icon}>
                  <ThemeIcon name={item.icon} width={18} height={18} />
                </span>
                <span className={styles.labels}>
                  <span className={styles["primary-label"]}>{item.label}</span>
                  {item.description ? (
                    <span className={styles["secondary-label"]}>
                      {item.description}
                    </span>
                  ) : null}
                </span>
                {item.secondaryLabel ? (
                  <span className={styles["meta-label"]}>
                    {item.secondaryLabel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UserMenu;
