import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { SUPPORT_EMAIL, REPORT_FORM_URL } from "@/config/support.js";
import UserButton from "./UserButton";
import UserMenu from "./UserMenu";
import UserSubmenu from "./UserSubmenu";
import type { MenuEntry, SubmenuItem, SubmenuState } from "./types";
import styles from "./UserMenu.module.css";

type SidebarUserMenuProps = {
  displayName: string;
  planLabel?: string | null;
  t: Record<string, string>;
  isPro: boolean;
  onOpenSettings: (tab?: string) => void;
  onOpenShortcuts: () => void;
  onOpenUpgrade: () => void;
  onOpenLogout: () => void;
};

const OPEN_DELAY = 120;
const CLOSE_DELAY = 100;

function SidebarUserMenu({
  displayName,
  planLabel,
  t,
  isPro,
  onOpenSettings,
  onOpenShortcuts,
  onOpenUpgrade,
  onOpenLogout,
}: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [submenuState, setSubmenuState] = useState<SubmenuState | null>(null);
  const [submenuActiveId, setSubmenuActiveId] = useState<string | null>(null);
  const [panelSide, setPanelSide] = useState<"above" | "below">("above");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const submenuItemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const menuId = useId();
  const helpItems = useMemo<SubmenuItem[]>(() => {
    const items: SubmenuItem[] = [];

    if (SUPPORT_EMAIL) {
      items.push({
        id: "help-support",
        icon: "email",
        label: t.helpCenter || t.help || "Help center",
        href: `mailto:${SUPPORT_EMAIL}`,
      });
    }

    if (REPORT_FORM_URL) {
      items.push({
        id: "help-report",
        icon: "flag",
        label: t.reportBug || t.report || "Report a bug",
        href: REPORT_FORM_URL,
        target: "_blank",
      });
    }

    items.push({
      id: "help-shortcuts",
      icon: "command-line",
      label: t.shortcuts || t.shortcutsTitle || "Keyboard shortcuts",
      secondary: "⌘ /",
      onSelect: onOpenShortcuts,
    });

    return items;
  }, [onOpenShortcuts, t]);

  const menuEntries = useMemo<MenuEntry[]>(() => {
    const entries: MenuEntry[] = [
      { type: "profile", id: "profile", name: displayName, plan: planLabel },
      { type: "divider", id: "divider-profile" },
      {
        type: "groupLabel",
        id: "group-primary",
        label: t.accountMenuPrimary || t.settings || "General",
      },
      {
        type: "item",
        id: "settings",
        icon: "cog-6-tooth",
        label: t.settings || "Settings",
        onSelect: () => onOpenSettings("general"),
      },
      {
        type: "item",
        id: "help",
        icon: "question-mark-circle",
        label: t.help || "Help",
        submenu: "help",
      },
    ];

    if (!isPro) {
      entries.push({
        type: "item",
        id: "upgrade",
        icon: "star-outline",
        label: t.upgrade || "Upgrade",
        onSelect: onOpenUpgrade,
      });
    }

    entries.push(
      { type: "divider", id: "divider-account" },
      {
        type: "groupLabel",
        id: "group-account",
        label: t.profileTitle || t.account || "Account",
      },
      {
        type: "item",
        id: "logout",
        icon: "arrow-right-on-rectangle",
        label: t.logout || "Logout",
        onSelect: onOpenLogout,
      },
    );

    return entries;
  }, [
    displayName,
    planLabel,
    t,
    isPro,
    onOpenSettings,
    onOpenUpgrade,
    onOpenLogout,
  ]);

  const interactiveIds = useMemo(
    () =>
      menuEntries
        .filter((entry) => entry.type === "item")
        .map((entry) => entry.id),
    [menuEntries],
  );

  const firstInteractiveId = interactiveIds[0] ?? null;

  const registerItem = useCallback((id: string, node: HTMLElement | null) => {
    if (!node) {
      itemRefs.current.delete(id);
      return;
    }
    itemRefs.current.set(id, node);
  }, []);

  const registerSubmenuItem = useCallback(
    (id: string, node: HTMLElement | null) => {
      if (!node) {
        submenuItemRefs.current.delete(id);
        return;
      }
      submenuItemRefs.current.set(id, node);
    },
    [],
  );

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeSubmenu = useCallback(() => {
    clearTimers();
    setSubmenuState(null);
    setSubmenuActiveId(null);
  }, [clearTimers]);

  const focusTrigger = useCallback(() => {
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveItemId(null);
    closeSubmenu();
    focusTrigger();
  }, [closeSubmenu, focusTrigger]);

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu();
    } else {
      setOpen(true);
    }
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
      if (event.key === "Tab") {
        const nodes = Array.from(
          containerRef.current?.querySelectorAll<HTMLElement>(
            "[role='menuitem']",
          ) || [],
        ).filter((node) => {
          const submenuNode = node.closest(`.${styles.submenu}`);
          if (submenuNode && submenuNode.getAttribute("data-open") !== "true") {
            return false;
          }
          return true;
        });

        if (nodes.length === 0) {
          event.preventDefault();
          return;
        }

        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first) {
            last.focus();
            event.preventDefault();
          }
          return;
        }

        if (active === last) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, open]);

  useLayoutEffect(() => {
    if (!open) return;
    if (!firstInteractiveId) return;
    setActiveItemId(firstInteractiveId);
  }, [firstInteractiveId, open]);

  useEffect(() => {
    if (!open || !activeItemId) return;
    const node = itemRefs.current.get(activeItemId);
    if (node && document.activeElement !== node) {
      node.focus();
    }
  }, [activeItemId, open]);

  useEffect(() => {
    if (!submenuState || !submenuActiveId) return;
    const node = submenuItemRefs.current.get(submenuActiveId);
    if (node && document.activeElement !== node) {
      node.focus();
    }
  }, [submenuActiveId, submenuState]);

  const evaluatePanelSide = useCallback(() => {
    const buttonRect = triggerRef.current?.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight || 0;
    if (!buttonRect) return;
    const spaceAbove = buttonRect.top;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    if (spaceAbove < menuHeight && spaceBelow > spaceAbove) {
      setPanelSide("below");
    } else {
      setPanelSide("above");
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    evaluatePanelSide();
  }, [evaluatePanelSide, open, menuEntries.length]);

  const openSubmenu = useCallback(
    (entryId: string, items: SubmenuItem[], anchor: HTMLElement) => {
      if (items.length === 0) {
        closeSubmenu();
        return;
      }
      const menuNode = menuRef.current;
      if (!menuNode) return;
      const menuRect = menuNode.getBoundingClientRect();
      const targetRect = anchor.getBoundingClientRect();
      const top = targetRect.top - menuRect.top + menuNode.scrollTop;
      setSubmenuState({
        id: entryId,
        anchorTop: top,
        items,
        side: panelSide,
      });
      setSubmenuActiveId(items[0]?.id ?? null);
    },
    [closeSubmenu, panelSide],
  );

  const handleRequestSubmenu = useCallback(
    (entry: Extract<MenuEntry, { type: "item" }>, target: HTMLElement) => {
      if (!entry.submenu) {
        closeSubmenu();
        return;
      }
      clearTimers();
      openTimerRef.current = window.setTimeout(() => {
        if (entry.submenu === "help") {
          openSubmenu(entry.id, helpItems, target);
        }
      }, OPEN_DELAY);
    },
    [clearTimers, closeSubmenu, helpItems, openSubmenu],
  );

  const scheduleCloseSubmenu = useCallback(() => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      closeSubmenu();
    }, CLOSE_DELAY);
  }, [clearTimers, closeSubmenu]);

  const handleItemSelect = useCallback(
    (
      entry: Extract<MenuEntry, { type: "item" }>,
      options: { viaKeyboard?: boolean } = {},
    ) => {
      const { viaKeyboard = false } = options;
      if (entry.submenu) {
        return;
      }
      closeMenu();
      entry.onSelect?.();
      if (entry.href && viaKeyboard) {
        if (entry.target === "_blank") {
          window.open(entry.href, entry.target);
        } else {
          window.location.href = entry.href;
        }
      }
    },
    [closeMenu],
  );

  const handleSubmenuSelect = useCallback(
    (item: SubmenuItem, options: { viaKeyboard?: boolean } = {}) => {
      const { viaKeyboard = false } = options;
      closeMenu();
      item.onSelect?.();
      if (item.href && viaKeyboard) {
        if (item.target === "_blank") {
          window.open(item.href, item.target);
        } else {
          window.location.href = item.href;
        }
      }
    },
    [closeMenu],
  );

  const focusMenuItemByOffset = useCallback(
    (offset: number) => {
      if (interactiveIds.length === 0) return;
      const currentIndex = activeItemId
        ? interactiveIds.indexOf(activeItemId)
        : 0;
      const nextIndex =
        (currentIndex + offset + interactiveIds.length) % interactiveIds.length;
      setActiveItemId(interactiveIds[nextIndex]);
      closeSubmenu();
    },
    [activeItemId, closeSubmenu, interactiveIds],
  );

  const handleMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!interactiveIds.length) return;
      const currentId = activeItemId ?? interactiveIds[0];
      const currentEntry = menuEntries.find(
        (entry): entry is Extract<MenuEntry, { type: "item" }> =>
          entry.type === "item" && entry.id === currentId,
      );

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          focusMenuItemByOffset(1);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          focusMenuItemByOffset(-1);
          break;
        }
        case "ArrowRight":
        case "Enter":
        case " ": {
          if (currentEntry?.submenu) {
            event.preventDefault();
            const node = itemRefs.current.get(currentEntry.id);
            if (node && currentEntry.submenu === "help") {
              openSubmenu(currentEntry.id, helpItems, node);
            }
          } else if (event.key !== "ArrowRight") {
            event.preventDefault();
            if (currentEntry) {
              handleItemSelect(currentEntry, { viaKeyboard: true });
            }
          }
          break;
        }
        case "ArrowLeft": {
          if (submenuState) {
            event.preventDefault();
            closeSubmenu();
          }
          break;
        }
        case "Escape": {
          event.preventDefault();
          closeMenu();
          break;
        }
        default:
      }
    },
    [
      activeItemId,
      closeMenu,
      closeSubmenu,
      focusMenuItemByOffset,
      handleItemSelect,
      helpItems,
      interactiveIds,
      menuEntries,
      openSubmenu,
      submenuState,
    ],
  );

  const handleSubmenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!submenuState) return;
      const ids = submenuState.items.map((item) => item.id);
      if (!ids.length) return;
      const currentIndex = submenuActiveId ? ids.indexOf(submenuActiveId) : 0;
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          setSubmenuActiveId(ids[(currentIndex + 1) % ids.length]);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          setSubmenuActiveId(ids[(currentIndex - 1 + ids.length) % ids.length]);
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          closeSubmenu();
          const parent = submenuState.id;
          const parentNode = itemRefs.current.get(parent);
          if (parentNode) {
            parentNode.focus();
          }
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          if (submenuActiveId) {
            const item = submenuState.items.find(
              (entry) => entry.id === submenuActiveId,
            );
            if (item) {
              handleSubmenuSelect(item, { viaKeyboard: true });
            }
          }
          break;
        }
        case "Escape": {
          event.preventDefault();
          closeMenu();
          break;
        }
        default:
      }
    },
    [
      closeMenu,
      closeSubmenu,
      handleSubmenuSelect,
      submenuActiveId,
      submenuState,
    ],
  );

  useEffect(() => {
    if (!open) {
      clearTimers();
      return;
    }
    const handleScroll = () => {
      if (!menuRef.current || !submenuState) return;
      const parentNode = itemRefs.current.get(submenuState.id);
      if (!parentNode) return;
      openSubmenu(submenuState.id, submenuState.items, parentNode);
    };
    const node = menuRef.current;
    node?.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      node?.removeEventListener("scroll", handleScroll);
    };
  }, [clearTimers, open, openSubmenu, submenuState]);

  return (
    <div ref={containerRef} className={styles.container}>
      <UserButton
        ref={triggerRef}
        open={open}
        name={displayName}
        planLabel={planLabel}
        menuId={menuId}
        onToggle={toggleMenu}
      />
      {open ? (
        <>
          <UserMenu
            id={menuId}
            entries={menuEntries}
            activeItemId={activeItemId}
            submenuOpenId={submenuState?.id ?? null}
            side={panelSide}
            menuRef={menuRef}
            onKeyDown={handleMenuKeyDown}
            onItemActivate={(id) => {
              setActiveItemId(id);
              if (submenuState?.id && submenuState.id !== id) {
                closeSubmenu();
              }
            }}
            onItemSelect={handleItemSelect}
            onRequestSubmenu={handleRequestSubmenu}
            onCloseSubmenu={scheduleCloseSubmenu}
            registerItem={registerItem}
          />
          <UserSubmenu
            open={Boolean(submenuState)}
            anchorTop={submenuState?.anchorTop ?? 0}
            side={submenuState?.side ?? panelSide}
            items={submenuState?.items ?? []}
            submenuRef={submenuRef}
            activeItemId={submenuActiveId}
            onKeyDown={handleSubmenuKeyDown}
            onItemActivate={(id) => {
              setSubmenuActiveId(id);
            }}
            onItemSelect={handleSubmenuSelect}
            registerItem={registerSubmenuItem}
            onMouseEnter={clearTimers}
            onMouseLeave={scheduleCloseSubmenu}
          />
        </>
      ) : null}
    </div>
  );
}

export default SidebarUserMenu;
