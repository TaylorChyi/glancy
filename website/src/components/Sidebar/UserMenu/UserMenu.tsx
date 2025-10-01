import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import ThemeIcon from "@/components/ui/Icon";
import { REPORT_FORM_URL, SUPPORT_EMAIL } from "@/config/support.js";
import UserButton from "./UserButton";
import UserSubmenu, { type UserSubmenuHandle } from "./UserSubmenu";
import type { MenuItem, MenuSubmenuItem, SubmenuLinkItem } from "./types";
import styles from "./UserMenu.module.css";

interface UserMenuProps {
  displayName: string;
  planLabel?: string;
  labels: {
    help: string;
    settings: string;
    shortcuts: string;
    shortcutsDescription?: string;
    logout: string;
    supportEmail?: string;
    report?: string;
  };
  onOpenSettings: (section?: string) => void;
  onOpenShortcuts: () => void;
  onOpenLogout: () => void;
}

type TimeoutHandle = ReturnType<typeof setTimeout>;

type SubmenuState = {
  id: string | null;
  top: number;
  focusOnMount: boolean;
  parentIndex: number;
  parentBottom: number;
  height: number;
};

const INITIAL_SUBMENU_STATE: SubmenuState = {
  id: null,
  top: 0,
  focusOnMount: false,
  parentIndex: -1,
  parentBottom: 0,
  height: 0,
};

/**
 * 意图：根据父级项的底边对齐子菜单，保持视觉上沿底贴合。
 * 输入：父项底边相对于菜单根节点的偏移量与子菜单高度。
 * 输出：用于定位子菜单的 top 偏移，保证不越界。
 */
const computeSubmenuTop = (parentBottom: number, height: number) =>
  Math.max(parentBottom - height, 0);

const SUBMENU_DELAY_IN = 40;
const SUBMENU_DELAY_OUT = 100;

function UserMenu({
  displayName,
  planLabel,
  labels,
  onOpenSettings,
  onOpenShortcuts,
  onOpenLogout,
}: UserMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const submenuRef = useRef<UserSubmenuHandle | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | HTMLAnchorElement | null>>(
    [],
  );
  const timers = useRef<{ open?: TimeoutHandle; close?: TimeoutHandle }>({});
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submenuState, setSubmenuState] = useState<SubmenuState>(
    INITIAL_SUBMENU_STATE,
  );
  const [placement, setPlacement] = useState<"up" | "down">("up");

  const supportItems = useMemo<SubmenuLinkItem[]>(() => {
    const items: SubmenuLinkItem[] = [];

    if (SUPPORT_EMAIL) {
      items.push({
        id: "support-email",
        icon: "email",
        label: labels.supportEmail || labels.help,
        href: `mailto:${SUPPORT_EMAIL}`,
        external: true,
      });
    }

    if (REPORT_FORM_URL) {
      items.push({
        id: "report",
        icon: "flag",
        label: labels.report || labels.help,
        href: REPORT_FORM_URL,
        external: true,
      });
    }

    items.push({
      id: "shortcuts",
      icon: "command-line",
      label: labels.shortcuts,
      onSelect: onOpenShortcuts,
    });

    return items;
  }, [
    labels.help,
    labels.report,
    labels.shortcuts,
    labels.supportEmail,
    onOpenShortcuts,
  ]);

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        kind: "action",
        id: "settings",
        icon: "cog-6-tooth",
        label: labels.settings,
        onSelect: () => onOpenSettings("general"),
      },
    ];

    const helpItem: MenuSubmenuItem = {
      kind: "submenu",
      id: "help",
      icon: "question-mark-circle",
      label: labels.help,
      description: labels.shortcutsDescription,
      items: supportItems,
    };

    if (helpItem.items.length > 0) {
      items.push(helpItem);
    }

    items.push({
      kind: "action",
      id: "logout",
      icon: "arrow-right-on-rectangle",
      label: labels.logout,
      onSelect: onOpenLogout,
    });

    return items;
  }, [
    labels.help,
    labels.logout,
    labels.settings,
    labels.shortcutsDescription,
    onOpenLogout,
    onOpenSettings,
    supportItems,
  ]);

  const interactiveItems = menuItems;

  const clearTimers = useCallback(() => {
    if (timers.current.open) {
      window.clearTimeout(timers.current.open);
      timers.current.open = undefined;
    }
    if (timers.current.close) {
      window.clearTimeout(timers.current.close);
      timers.current.close = undefined;
    }
  }, []);

  const cancelScheduledClose = useCallback(() => {
    if (timers.current.close) {
      window.clearTimeout(timers.current.close);
      timers.current.close = undefined;
    }
  }, []);

  const updateSubmenuPosition = useCallback(() => {
    setSubmenuState((prev) => {
      if (!prev.id || prev.parentIndex < 0) return prev;
      const rootNode = rootRef.current;
      const parentNode = itemRefs.current[prev.parentIndex];
      if (!rootNode || !parentNode) return prev;
      const rootRect = rootNode.getBoundingClientRect();
      const parentRect = parentNode.getBoundingClientRect();
      const parentBottom = parentRect.bottom - rootRect.top;
      const nextTop = computeSubmenuTop(parentBottom, prev.height);
      if (
        Math.abs(nextTop - prev.top) < 0.5 &&
        Math.abs(parentBottom - prev.parentBottom) < 0.5
      ) {
        return prev;
      }
      return { ...prev, top: nextTop, parentBottom };
    });
  }, []);

  const handleSubmenuHeightChange = useCallback((height: number) => {
    setSubmenuState((prev) => {
      if (!prev.id) return prev;
      const nextTop = computeSubmenuTop(prev.parentBottom, height);
      if (
        Math.abs(nextTop - prev.top) < 0.5 &&
        Math.abs(height - prev.height) < 0.5
      ) {
        return prev;
      }
      return { ...prev, top: nextTop, height };
    });
  }, []);

  useEffect(() => {
    updateSubmenuPosition();
  }, [activeIndex, updateSubmenuPosition]);

  useEffect(() => {
    const node = menuRef.current;
    if (!node) return undefined;
    const handleScroll = () => updateSubmenuPosition();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, [updateSubmenuPosition]);

  useEffect(() => {
    if (!open) {
      setSubmenuState(INITIAL_SUBMENU_STATE);
      clearTimers();
    }
  }, [open, clearTimers]);

  const computeDefaultIndex = useCallback(() => {
    if (interactiveItems.length === 0) return 0;
    const firstEnabled = interactiveItems.findIndex((item) => !item.disabled);
    return firstEnabled >= 0 ? firstEnabled : 0;
  }, [interactiveItems]);

  const closeSubmenu = useCallback(
    (focusParent = false) => {
      clearTimers();
      setSubmenuState((prev) => {
        if (focusParent && prev.parentIndex >= 0) {
          const parentNode = itemRefs.current[prev.parentIndex];
          if (parentNode) {
            parentNode.focus();
            setActiveIndex(prev.parentIndex);
          }
        }
        return INITIAL_SUBMENU_STATE;
      });
    },
    [clearTimers],
  );

  const openSubmenu = useCallback(
    (item: MenuSubmenuItem, index: number, focusOnMount: boolean) => {
      if (!item.items.length) return;
      clearTimers();
      const rootNode = rootRef.current;
      const parentNode = itemRefs.current[index];
      if (!rootNode || !parentNode) return;
      const rootRect = rootNode.getBoundingClientRect();
      const parentRect = parentNode.getBoundingClientRect();
      const parentBottom = parentRect.bottom - rootRect.top;
      const measuredHeight =
        submenuRef.current?.getCurrentHeight?.() ?? INITIAL_SUBMENU_STATE.height;
      setSubmenuState({
        id: item.id,
        top: computeSubmenuTop(parentBottom, measuredHeight),
        focusOnMount,
        parentIndex: index,
        parentBottom,
        height: measuredHeight,
      });
    },
    [clearTimers],
  );

  const scheduleSubmenuOpen = useCallback(
    (item: MenuSubmenuItem, index: number) => {
      cancelScheduledClose();
      if (timers.current.open) {
        window.clearTimeout(timers.current.open);
      }
      timers.current.open = window.setTimeout(() => {
        openSubmenu(item, index, false);
      }, SUBMENU_DELAY_IN);
    },
    [cancelScheduledClose, openSubmenu],
  );

  const scheduleSubmenuClose = useCallback(() => {
    cancelScheduledClose();
    if (timers.current.open) {
      window.clearTimeout(timers.current.open);
      timers.current.open = undefined;
    }
    timers.current.close = window.setTimeout(() => {
      closeSubmenu();
    }, SUBMENU_DELAY_OUT);
  }, [cancelScheduledClose, closeSubmenu]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    closeSubmenu();
  }, [closeSubmenu]);

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

  useEffect(() => () => clearTimers(), [clearTimers]);

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
      } else if (event.key === "Tab") {
        const focusables: HTMLElement[] = [];
        itemRefs.current.forEach((node) => {
          if (node) focusables.push(node);
        });
        if (submenuState.id && submenuRef.current) {
          focusables.push(...submenuRef.current.getFocusable());
        }
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const currentNode = document.activeElement as HTMLElement | null;
        const currentIndex = currentNode ? focusables.indexOf(currentNode) : -1;
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
  }, [closeMenu, open, submenuState.id]);

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
      Math.min(viewportHeight * 0.6, 420),
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
      updateSubmenuPosition();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePlacement, updateSubmenuPosition]);

  useEffect(() => {
    if (!open) return;
    const current = itemRefs.current[activeIndex];
    if (current) {
      current.focus();
    }
  }, [activeIndex, open]);

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
        if (currentItem.kind !== "submenu") {
          closeSubmenu();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(-1);
        if (currentItem.kind !== "submenu") {
          closeSubmenu();
        }
      } else if (event.key === "ArrowRight") {
        if (currentItem.kind === "submenu") {
          event.preventDefault();
          openSubmenu(currentItem, activeIndex, true);
        }
      } else if (event.key === "ArrowLeft") {
        if (submenuState.id) {
          event.preventDefault();
          closeSubmenu(true);
        }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (currentItem.kind === "submenu") {
          openSubmenu(currentItem, activeIndex, true);
        } else if (!currentItem.disabled) {
          currentItem.onSelect();
          closeMenu();
        }
      }
    },
    [
      activeIndex,
      closeMenu,
      closeSubmenu,
      interactiveItems,
      moveFocus,
      open,
      openSubmenu,
      submenuState.id,
    ],
  );

  const setItemRef = useCallback(
    (index: number) => (node: HTMLButtonElement | HTMLAnchorElement | null) => {
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
        onMouseEnter={cancelScheduledClose}
        onMouseLeave={() => {
          if (submenuState.id) {
            scheduleSubmenuClose();
          }
        }}
      >
        <div className={styles.list}>
          {menuItems.map((item, interactiveIndex) => {
            const isActive = activeIndex === interactiveIndex;

            const commonProps = {
              ref: setItemRef(interactiveIndex),
              className: styles["menu-item"],
              "data-active": isActive,
              role: "menuitem" as const,
              tabIndex: isActive ? 0 : -1,
              onFocus: () => {
                setActiveIndex(interactiveIndex);
                if (item.kind === "submenu") {
                  scheduleSubmenuOpen(item, interactiveIndex);
                } else {
                  closeSubmenu();
                }
              },
              onMouseEnter: () => {
                setActiveIndex(interactiveIndex);
                if (item.kind === "submenu") {
                  scheduleSubmenuOpen(item, interactiveIndex);
                } else {
                  closeSubmenu();
                }
              },
              onMouseLeave: () => {
                if (item.kind === "submenu") {
                  scheduleSubmenuClose();
                }
              },
            };

            if (item.kind === "submenu") {
              return (
                <button
                  key={item.id}
                  type="button"
                  {...commonProps}
                >
                  <span className={styles.icon}>
                    <ThemeIcon name={item.icon} width={18} height={18} />
                  </span>
                  <span className={styles.labels}>
                    <span className={styles["primary-label"]}>
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className={styles["secondary-label"]}>
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles["submenu-indicator"]}>›</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                {...commonProps}
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
      <UserSubmenu
        ref={submenuRef}
        open={Boolean(submenuState.id)}
        top={submenuState.top}
        items={
          submenuState.id
            ? ((
                interactiveItems.find(
                  (item) =>
                    item.kind === "submenu" && item.id === submenuState.id,
                ) as MenuSubmenuItem | undefined
              )?.items ?? [])
            : []
        }
        onAction={() => {
          closeMenu();
        }}
        onClose={closeSubmenu}
        onPointerEnter={cancelScheduledClose}
        onPointerLeave={() => {
          scheduleSubmenuClose();
        }}
        requestCloseFromKeyboard={() => {
          closeSubmenu(true);
        }}
        focusOnMount={submenuState.focusOnMount}
        onHeightChange={handleSubmenuHeightChange}
      />
    </div>
  );
}

export default UserMenu;
