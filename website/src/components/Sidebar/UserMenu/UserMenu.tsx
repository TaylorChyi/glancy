import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import ThemeIcon from "@/components/ui/Icon";
import UserButton from "./UserButton";
import UserSubmenu, { SubmenuItem } from "./UserSubmenu";
import styles from "./UserMenu.module.css";

type TranslationMap = Record<string, string>;

type MenuItemNode = {
  type: "item";
  key: string;
  label: string;
  icon: string;
  hint?: string;
  onSelect?: () => void;
  submenu?: SubmenuItem[];
};

type MenuDividerNode = { type: "divider"; key: string };

type MenuLabelNode = { type: "label"; key: string; label: string };

type MenuNode = MenuItemNode | MenuDividerNode | MenuLabelNode;

type SidebarUser = {
  username?: string;
  plan?: string;
  member?: boolean;
  isPro?: boolean;
};

type UserMenuProps = {
  user: SidebarUser;
  size: number;
  t: TranslationMap;
  onOpenSettings: () => void;
  onOpenUpgrade?: () => void;
  onOpenKeyboard: () => void;
  onOpenLogout: () => void;
};

const HELP_EVENT_NAME = "glancy-help";

function readCssNumber(variableName: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(variableName);
  const numeric = parseFloat(raw);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function emitHelpEvent(action: SubmenuItem["key"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HELP_EVENT_NAME, { detail: { action } }),
  );
}

function normalizePlanLabel(planLabel: string) {
  if (!planLabel) return "";
  return planLabel.toUpperCase();
}

function getUserPlanLabel(user: SidebarUser) {
  const plan = user?.plan || (user?.isPro ? "plus" : "free");
  return normalizePlanLabel(plan ?? "");
}

function resolveUserName(user: SidebarUser, fallback: string) {
  if (user?.username && user.username.trim().length > 0) {
    return user.username;
  }
  return fallback;
}

function UserMenu({
  user,
  size,
  t,
  onOpenSettings,
  onOpenUpgrade,
  onOpenKeyboard,
  onOpenLogout,
}: UserMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const helpItemRef = useRef<HTMLButtonElement | null>(null);
  const sidebarRectRef = useRef<DOMRect | null>(null);
  const submenuTimers = useRef<{ open?: number; close?: number }>({});

  const menuId = useId();
  const submenuId = useId();

  const [open, setOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const [submenuStyle, setSubmenuStyle] = useState<CSSProperties>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [submenuActiveIndex, setSubmenuActiveIndex] = useState(0);

  const submenuDelayIn = useMemo(
    () => readCssNumber("--submenu-delay-in", 120),
    [],
  );
  const submenuDelayOut = useMemo(
    () => readCssNumber("--submenu-delay-out", 100),
    [],
  );
  const safeMargin = useMemo(() => readCssNumber("--user-menu-safe", 10), []);
  const submenuGap = useMemo(() => readCssNumber("--submenu-gap", 10), []);

  const username = useMemo(
    () => resolveUserName(user, t.guest || "Guest"),
    [t.guest, user],
  );
  const planLabel = useMemo(() => getUserPlanLabel(user), [user]);
  const isPro = Boolean(user?.member || user?.isPro || user?.plan !== "free");

  const helpItems = useMemo<SubmenuItem[]>(
    () => [
      {
        key: "center",
        label: t.helpCenter ?? "Help center",
        icon: "question-mark-circle",
        onSelect: () => emitHelpEvent("center"),
      },
      {
        key: "notes",
        label: t.releaseNotes ?? "Release notes",
        icon: "refresh",
        onSelect: () => emitHelpEvent("notes"),
      },
      {
        key: "terms",
        label: t.termsPolicies ?? "Terms & policies",
        icon: "shield-check",
        onSelect: () => emitHelpEvent("terms"),
      },
      {
        key: "bug",
        label: t.reportBug ?? "Report an issue",
        icon: "flag",
        onSelect: () => emitHelpEvent("bug"),
      },
      {
        key: "apps",
        label: t.downloadApps ?? "Download apps",
        icon: "phone",
        onSelect: () => emitHelpEvent("apps"),
      },
      {
        key: "shortcuts",
        label: t.shortcuts ?? "Shortcuts",
        icon: "command-line",
        hint: "⌘/",
        onSelect: onOpenKeyboard,
      },
    ],
    [
      onOpenKeyboard,
      t.downloadApps,
      t.helpCenter,
      t.releaseNotes,
      t.reportBug,
      t.shortcuts,
      t.termsPolicies,
    ],
  );

  const menuNodes = useMemo<MenuNode[]>(() => {
    const nodes: MenuNode[] = [];
    nodes.push({
      type: "item",
      key: "help",
      label: t.help ?? "Help",
      icon: "question-mark-circle",
      submenu: helpItems,
    });
    if (!isPro && typeof onOpenUpgrade === "function") {
      nodes.push({
        type: "item",
        key: "upgrade",
        label: t.upgrade ?? "Upgrade",
        icon: "sparkles",
        onSelect: onOpenUpgrade,
      });
    }
    nodes.push({
      type: "item",
      key: "settings",
      label: t.settings ?? "Settings",
      icon: "cog-6-tooth",
      onSelect: onOpenSettings,
    });
    nodes.push({ type: "divider", key: "divider-main" });
    nodes.push({
      type: "item",
      key: "logout",
      label: t.logout ?? "Log out",
      icon: "arrow-right-on-rectangle",
      onSelect: onOpenLogout,
    });
    return nodes;
  }, [
    helpItems,
    isPro,
    onOpenLogout,
    onOpenSettings,
    onOpenUpgrade,
    t.help,
    t.logout,
    t.settings,
    t.upgrade,
  ]);

  const focusableItems = useMemo(
    () =>
      menuNodes.filter((node): node is MenuItemNode => node.type === "item"),
    [menuNodes],
  );
  const helpIndex = useMemo(
    () => focusableItems.findIndex((item) => item.key === "help"),
    [focusableItems],
  );

  const clearSubmenuTimers = useCallback(() => {
    if (submenuTimers.current.open) {
      window.clearTimeout(submenuTimers.current.open);
      submenuTimers.current.open = undefined;
    }
    if (submenuTimers.current.close) {
      window.clearTimeout(submenuTimers.current.close);
      submenuTimers.current.close = undefined;
    }
  }, []);

  const collapseSubmenu = useCallback(() => {
    clearSubmenuTimers();
    setSubmenuOpen(false);
  }, [clearSubmenuTimers]);

  const updateSubmenuPosition = useCallback(() => {
    if (!submenuOpen) return;
    const sidebarRect = sidebarRectRef.current;
    const helpNode = helpItemRef.current;
    if (!helpNode) return;
    const helpRect = helpNode.getBoundingClientRect();
    const left = (sidebarRect?.right ?? helpRect.right) + submenuGap;
    const nextStyle: CSSProperties = {
      top: `${helpRect.top}px`,
      left: `${left}px`,
    };
    setSubmenuStyle((prev) => {
      if (
        prev &&
        prev.top === nextStyle.top &&
        prev.left === nextStyle.left &&
        prev.width === nextStyle.width
      ) {
        return prev;
      }
      return nextStyle;
    });
  }, [submenuGap, submenuOpen]);

  const openSubmenu = useCallback(() => {
    if (helpItems.length === 0) return;
    clearSubmenuTimers();
    setSubmenuActiveIndex((index) => {
      if (index >= helpItems.length) {
        return 0;
      }
      return index;
    });
    setSubmenuOpen(true);
    window.requestAnimationFrame(() => {
      updateSubmenuPosition();
    });
  }, [clearSubmenuTimers, helpItems.length, updateSubmenuPosition]);

  const scheduleSubmenuOpen = useCallback(() => {
    clearSubmenuTimers();
    submenuTimers.current.open = window.setTimeout(() => {
      openSubmenu();
    }, submenuDelayIn);
  }, [clearSubmenuTimers, openSubmenu, submenuDelayIn]);

  const scheduleSubmenuClose = useCallback(() => {
    if (!submenuOpen) return;
    clearSubmenuTimers();
    submenuTimers.current.close = window.setTimeout(() => {
      setSubmenuOpen(false);
    }, submenuDelayOut);
  }, [clearSubmenuTimers, submenuDelayOut, submenuOpen]);

  const updateMenuPosition = useCallback(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const sidebar = trigger.closest("aside.sidebar");
    if (!(sidebar instanceof HTMLElement)) return;
    const sidebarRect = sidebar.getBoundingClientRect();
    sidebarRectRef.current = sidebarRect;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const width = Math.max(0, sidebarRect.width - safeMargin * 2);
    const left = sidebarRect.left + safeMargin;
    const gap = 8;
    let top = triggerRect.top - menuRect.height - gap;
    const minTop = 16;
    if (top < minTop) {
      top = minTop;
    }
    const nextStyle: CSSProperties = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
    };
    setMenuStyle((prev) => {
      if (
        prev &&
        prev.left === nextStyle.left &&
        prev.top === nextStyle.top &&
        prev.width === nextStyle.width
      ) {
        return prev;
      }
      return nextStyle;
    });
    if (submenuOpen) {
      updateSubmenuPosition();
    }
  }, [open, safeMargin, submenuOpen, updateSubmenuPosition]);

  const focusItem = useCallback(
    (nextIndex: number, options?: { delayClose?: boolean }) => {
      if (focusableItems.length === 0) return;
      const normalized =
        (nextIndex + focusableItems.length) % focusableItems.length;
      setActiveIndex(normalized);
      const item = focusableItems[normalized];
      if (item?.submenu && item.submenu.length > 0) {
        setSubmenuActiveIndex((prev) =>
          prev >= item.submenu!.length ? 0 : prev,
        );
        scheduleSubmenuOpen();
      } else {
        if (options?.delayClose) {
          scheduleSubmenuClose();
        } else {
          collapseSubmenu();
        }
      }
    },
    [
      collapseSubmenu,
      focusableItems,
      scheduleSubmenuClose,
      scheduleSubmenuOpen,
    ],
  );

  const closeMenu = useCallback(() => {
    clearSubmenuTimers();
    setOpen(false);
    setSubmenuOpen(false);
    setMenuReady(false);
    setActiveIndex(0);
    setSubmenuActiveIndex(0);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
    });
  }, [clearSubmenuTimers]);

  const handleMenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentItem = focusableItems[activeIndex];
      switch (event.key) {
        case "Tab":
          event.preventDefault();
          focusItem(activeIndex + (event.shiftKey ? -1 : 1));
          break;
        case "ArrowDown":
          event.preventDefault();
          focusItem(activeIndex + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusItem(activeIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          focusItem(0);
          break;
        case "End":
          event.preventDefault();
          focusItem(focusableItems.length - 1);
          break;
        case "ArrowRight":
          if (currentItem?.submenu && currentItem.submenu.length > 0) {
            event.preventDefault();
            setSubmenuActiveIndex(0);
            openSubmenu();
          }
          break;
        case "ArrowLeft":
          if (submenuOpen) {
            event.preventDefault();
            collapseSubmenu();
            if (helpIndex >= 0) {
              focusItem(helpIndex);
            }
          }
          break;
        case "Escape":
          event.preventDefault();
          closeMenu();
          break;
        case "Enter":
        case " ":
          if (!currentItem) break;
          event.preventDefault();
          if (currentItem.submenu && currentItem.submenu.length > 0) {
            setSubmenuActiveIndex(0);
            openSubmenu();
          } else {
            currentItem.onSelect?.();
            closeMenu();
          }
          break;
        default:
      }
    },
    [
      activeIndex,
      closeMenu,
      collapseSubmenu,
      focusItem,
      focusableItems,
      helpIndex,
      openSubmenu,
      submenuOpen,
    ],
  );

  const handleSubmenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (helpItems.length === 0) return;
      switch (event.key) {
        case "Tab":
          event.preventDefault();
          collapseSubmenu();
          if (event.shiftKey) {
            focusItem(helpIndex);
          } else {
            focusItem(helpIndex + 1);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          setSubmenuActiveIndex((index) => (index + 1) % helpItems.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setSubmenuActiveIndex(
            (index) => (index - 1 + helpItems.length) % helpItems.length,
          );
          break;
        case "ArrowLeft":
          event.preventDefault();
          collapseSubmenu();
          focusItem(helpIndex);
          break;
        case "Escape":
          event.preventDefault();
          closeMenu();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          helpItems[submenuActiveIndex]?.onSelect();
          closeMenu();
          break;
        default:
      }
    },
    [
      closeMenu,
      collapseSubmenu,
      focusItem,
      helpIndex,
      helpItems,
      submenuActiveIndex,
    ],
  );

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const handleResize = () => updateMenuPosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (
        menuRef.current?.contains(event.target as Node) ||
        submenuRef.current?.contains(event.target as Node) ||
        triggerRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      closeMenu();
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
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
    const raf = window.requestAnimationFrame(() => setMenuReady(true));
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = menuItemRefs.current[activeIndex] ?? menuItemRefs.current[0];
    target?.focus({ preventScroll: true });
  }, [activeIndex, open]);

  const handleToggle = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    setMenuReady(false);
    setActiveIndex(0);
    setSubmenuActiveIndex(0);
    clearSubmenuTimers();
    setOpen(true);
  }, [clearSubmenuTimers, closeMenu, open]);

  const helpButtonId = `${menuId}-help`;

  const renderMenuNode = useCallback(
    (node: MenuNode): ReactNode => {
      if (node.type === "divider") {
        return (
          <div
            key={node.key}
            className={styles["menu-divider"]}
            role="separator"
          />
        );
      }
      if (node.type === "label") {
        return (
          <div key={node.key} className={styles["menu-group-label"]}>
            {node.label}
          </div>
        );
      }
      const focusIndex = focusableItems.findIndex(
        (item) => item.key === node.key,
      );
      return (
        <button
          key={node.key}
          type="button"
          id={node.key === "help" ? helpButtonId : undefined}
          ref={(element) => {
            if (focusIndex >= 0) {
              menuItemRefs.current[focusIndex] = element;
            }
            if (node.key === "help") {
              helpItemRef.current = element;
            }
          }}
          role="menuitem"
          className={styles["menu-item"]}
          data-active={activeIndex === focusIndex ? "true" : "false"}
          aria-haspopup={
            node.submenu && node.submenu.length > 0 ? "menu" : undefined
          }
          aria-expanded={
            node.submenu && node.submenu.length > 0
              ? submenuOpen
                ? "true"
                : "false"
              : undefined
          }
          onMouseEnter={() => {
            if (focusIndex >= 0) {
              focusItem(focusIndex, { delayClose: true });
            }
          }}
          onFocus={() => {
            if (focusIndex >= 0) {
              focusItem(focusIndex);
            }
          }}
          onClick={() => {
            if (node.submenu && node.submenu.length > 0) {
              setSubmenuActiveIndex(0);
              openSubmenu();
            } else {
              node.onSelect?.();
              closeMenu();
            }
          }}
        >
          <span className={styles["menu-icon-wrapper"]} aria-hidden="true">
            <ThemeIcon
              name={node.icon}
              width={20}
              height={20}
              className={styles["menu-icon"]}
            />
          </span>
          <span className={styles["menu-label"]}>{node.label}</span>
          {node.submenu && node.submenu.length > 0 ? (
            <span className={styles["menu-meta"]} aria-hidden="true">
              <ThemeIcon
                name="arrow-right"
                width={16}
                height={16}
                className={styles["menu-icon"]}
              />
            </span>
          ) : null}
          {node.hint ? (
            <span className={styles["menu-meta"]}>{node.hint}</span>
          ) : null}
        </button>
      );
    },
    [
      activeIndex,
      closeMenu,
      focusItem,
      focusableItems,
      helpButtonId,
      openSubmenu,
      scheduleSubmenuOpen,
      submenuOpen,
    ],
  );

  return (
    <div className={styles["dock-root"]}>
      <UserButton
        ref={triggerRef}
        open={open}
        username={username}
        planLabel={planLabel}
        size={size}
        onToggle={handleToggle}
        aria-controls={menuId}
      />
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className={styles["menu-panel"]}
          data-ready={menuReady ? "true" : "false"}
          data-entering={menuReady ? "false" : "true"}
          style={menuStyle}
          onKeyDown={handleMenuKeyDown}
        >
          {menuNodes.map((node) => renderMenuNode(node))}
        </div>
      ) : null}
      <UserSubmenu
        ref={submenuRef}
        id={submenuId}
        labelledBy={helpButtonId}
        open={submenuOpen}
        items={helpItems}
        activeIndex={submenuActiveIndex}
        onActiveIndexChange={setSubmenuActiveIndex}
        onClose={closeMenu}
        onKeyDown={handleSubmenuKeyDown}
        style={submenuStyle}
        onPointerEnter={() => {
          clearSubmenuTimers();
          setSubmenuOpen(true);
          updateSubmenuPosition();
        }}
        onPointerLeave={(event) => {
          if (
            event.relatedTarget &&
            submenuRef.current?.contains(event.relatedTarget as Node)
          ) {
            return;
          }
          scheduleSubmenuClose();
        }}
      />
    </div>
  );
}

export default UserMenu;
