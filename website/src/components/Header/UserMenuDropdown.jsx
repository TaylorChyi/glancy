import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Header.module.css";

const HELP_ITEMS = [
  { key: "center", icon: "question-mark-circle", labelKey: "helpCenter" },
  { key: "notes", icon: "refresh", labelKey: "releaseNotes" },
  { key: "terms", icon: "shield-check", labelKey: "termsPolicies" },
  { key: "bug", icon: "flag", labelKey: "reportBug" },
  { key: "apps", icon: "phone", labelKey: "downloadApps" },
];

const noop = () => {};

const emitHelpEvent = (action) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("glancy-help", { detail: { action } }));
};

function UserMenuDropdown({
  open,
  setOpen,
  t,
  isPro,
  openProfile,
  openSettings,
  openShortcuts,
  openUpgrade,
  openLogout,
}) {
  const containerRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setHelpOpen(false);
      return noop;
    }
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    },
    [],
  );

  const closeMenu = useCallback(() => {
    setHelpOpen(false);
    setOpen(false);
  }, [setOpen]);

  const handleAction = useCallback(
    (handler) => () => {
      if (typeof handler === "function") {
        handler();
      }
      closeMenu();
    },
    [closeMenu],
  );

  const helpItems = useMemo(
    () =>
      HELP_ITEMS.map((item) => ({
        ...item,
        label: t[item.labelKey] || item.labelKey,
      })),
    [t],
  );

  const handleHelpItem = useCallback(
    (action) => () => {
      emitHelpEvent(action);
      closeMenu();
    },
    [closeMenu],
  );

  const handleHelpBlur = useCallback(() => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setHelpOpen(false);
      }
    }, 120);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={styles["user-menu-dropdown"]}
      onMouseLeave={() => setHelpOpen(false)}
    >
      <div className={styles["menu-panel"]} role="menu">
        {!isPro ? (
          <button
            type="button"
            role="menuitem"
            className={styles["menu-item"]}
            onClick={handleAction(openUpgrade)}
          >
            <span className={styles["menu-item-left"]}>
              <ThemeIcon
                name="shield-check"
                className={styles["menu-icon"]}
                width={20}
                height={20}
                tone="dark"
              />
              {t.upgrade}
            </span>
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          onClick={handleAction(openProfile)}
        >
          <span className={styles["menu-item-left"]}>
            <ThemeIcon
              name="adjustments-horizontal"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
            {t.profile}
          </span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          onClick={handleAction(openSettings)}
        >
          <span className={styles["menu-item-left"]}>
            <ThemeIcon
              name="cog-6-tooth"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
            {t.settings}
          </span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          onClick={handleAction(openShortcuts)}
        >
          <span className={styles["menu-item-left"]}>
            <ThemeIcon
              name="command-line"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
            {t.shortcuts}
          </span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          aria-haspopup="true"
          aria-expanded={helpOpen}
          onMouseEnter={() => setHelpOpen(true)}
          onFocus={() => setHelpOpen(true)}
          onBlur={handleHelpBlur}
          onClick={() => setHelpOpen((prev) => !prev)}
        >
          <span className={styles["menu-item-left"]}>
            <ThemeIcon
              name="question-mark-circle"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
            {t.help}
          </span>
          <span className={styles["menu-trailing"]} aria-hidden="true">
            <ThemeIcon
              name="arrow-right"
              className={styles["menu-icon"]}
              width={18}
              height={18}
              tone="dark"
            />
          </span>
        </button>
        <hr className={styles["menu-divider"]} />
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          onClick={() => {
            if (typeof openLogout === "function") {
              openLogout();
            }
            setHelpOpen(false);
            setOpen(false);
          }}
        >
          <span className={styles["menu-item-left"]}>
            <ThemeIcon
              name="arrow-right-on-rectangle"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
            {t.logout}
          </span>
        </button>
      </div>
      <div
        className={styles["submenu-panel"]}
        role="menu"
        aria-hidden={!helpOpen}
        data-open={helpOpen ? "true" : "false"}
      >
        {helpItems.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={styles["submenu-item"]}
            onClick={handleHelpItem(item.key)}
            onFocus={() => setHelpOpen(true)}
          >
            <ThemeIcon
              name={item.icon}
              className={styles["submenu-icon"]}
              width={22}
              height={22}
              tone="dark"
            />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default UserMenuDropdown;
