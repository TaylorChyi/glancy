import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Header.module.css";

const noop = () => {};

const HELP_ITEMS = [
  { key: "center", icon: "question-mark-circle", labelKey: "helpCenter" },
  { key: "notes", icon: "refresh", labelKey: "releaseNotes" },
  { key: "terms", icon: "shield-check", labelKey: "termsPolicies" },
  { key: "bug", icon: "flag", labelKey: "reportBug" },
  { key: "apps", icon: "phone", labelKey: "downloadApps" },
];

const emitHelpEvent = (action) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("glancy-help", { detail: { action } }));
};

function UserMenuDropdown({
  open,
  setOpen,
  t,
  isPro,
  onOpenSettings,
  onOpenUpgrade,
  onOpenLogout,
}) {
  const rootRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  /**
   * 背景说明：
   *  - Header 的帮助入口需要与 Sidebar 一致地支持 Pointer 事件，以保证触控/触笔设备的悬浮能力。
   * 设计取舍：
   *  - 采用最小状态机（open/close）而非延时器方案，避免一次性补丁并保持可读性；
   *    若未来需引入延时策略，可在此处扩展。
   */
  const openHelpSubmenu = useCallback(() => setHelpOpen(true), []);
  const closeHelpSubmenu = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    if (!open) {
      closeHelpSubmenu();
      return noop;
    }
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        closeHelpSubmenu();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeHelpSubmenu, open, setOpen]);

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
    closeHelpSubmenu();
    setOpen(false);
  }, [closeHelpSubmenu, setOpen]);

  const handleMenuAction = useCallback(
    (callback) => () => {
      if (typeof callback === "function") {
        callback();
      }
      closeMenu();
    },
    [closeMenu],
  );

  const resolvedHelpItems = useMemo(
    () =>
      HELP_ITEMS.map((item) => ({
        ...item,
        label: t[item.labelKey] || item.labelKey,
      })),
    [t],
  );

  const handleHelpBlur = useCallback(() => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        closeHelpSubmenu();
      }
    }, 120);
  }, [closeHelpSubmenu]);

  const handleHelpItem = useCallback(
    (item) => () => {
      emitHelpEvent(item.key);
      closeMenu();
    },
    [closeMenu],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className={styles["user-menu-dropdown"]}
      onPointerLeave={closeHelpSubmenu}
    >
      <div className={styles["menu-panel"]} role="menu">
        {!isPro ? (
          <button
            type="button"
            role="menuitem"
            className={styles["menu-item"]}
            onClick={handleMenuAction(onOpenUpgrade)}
          >
            <span className={styles["menu-item-leading"]} aria-hidden="true">
              <ThemeIcon
                name="shield-check"
                className={styles["menu-icon"]}
                width={20}
                height={20}
                tone="dark"
              />
            </span>
            <span className={styles["menu-label"]}>{t.upgrade}</span>
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          onClick={handleMenuAction(onOpenSettings)}
        >
          <span className={styles["menu-item-leading"]} aria-hidden="true">
            <ThemeIcon
              name="cog-6-tooth"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
          </span>
          <span className={styles["menu-label"]}>{t.settings}</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={styles["menu-item"]}
          aria-haspopup="true"
          aria-expanded={helpOpen}
          onPointerEnter={openHelpSubmenu}
          onFocus={openHelpSubmenu}
          onBlur={handleHelpBlur}
          onClick={() => setHelpOpen((prev) => !prev)}
        >
          <span className={styles["menu-item-leading"]} aria-hidden="true">
            <ThemeIcon
              name="question-mark-circle"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
          </span>
          <span className={styles["menu-label"]}>{t.help}</span>
          <span className={styles["menu-item-trailing"]} aria-hidden="true">
            <ThemeIcon
              name="arrow-right"
              className={styles["menu-icon"]}
              width={18}
              height={18}
              tone="dark"
            />
          </span>
        </button>
        <div className={styles["menu-divider"]} aria-hidden="true" />
        <button
          type="button"
          role="menuitem"
          className={`${styles["menu-item"]} ${styles["menu-item-danger"]}`}
          onClick={handleMenuAction(onOpenLogout)}
        >
          <span className={styles["menu-item-leading"]} aria-hidden="true">
            <ThemeIcon
              name="arrow-right-on-rectangle"
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
          </span>
          <span className={styles["menu-label"]}>{t.logout}</span>
        </button>
      </div>
      <div
        className={styles["submenu-panel"]}
        role="menu"
        aria-hidden={!helpOpen}
        data-open={helpOpen ? "true" : "false"}
      >
        {resolvedHelpItems.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={styles["submenu-item"]}
            onClick={handleHelpItem(item)}
            onPointerEnter={openHelpSubmenu}
            onFocus={openHelpSubmenu}
          >
            <span className={styles["submenu-icon-wrapper"]} aria-hidden="true">
              <ThemeIcon
                name={item.icon}
                className={styles["submenu-icon"]}
                width={22}
                height={22}
                tone="dark"
              />
            </span>
            <span className={styles["submenu-label"]}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

UserMenuDropdown.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
  isPro: PropTypes.bool,
  onOpenSettings: PropTypes.func,
  onOpenUpgrade: PropTypes.func,
  onOpenLogout: PropTypes.func,
};

UserMenuDropdown.defaultProps = {
  isPro: false,
  onOpenSettings: undefined,
  onOpenUpgrade: undefined,
  onOpenLogout: undefined,
};

export default UserMenuDropdown;
