import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./Header.module.css";

const useMenuClose = (open, setOpen) => {
  const rootRef = useRef(null);
  const closeMenu = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, closeMenu]);

  const handleMenuAction = useCallback(
    (callback) => () => {
      if (typeof callback === "function") {
        callback();
      }
      closeMenu();
    },
    [closeMenu],
  );

  return { rootRef, handleMenuAction };
};

const useTranslate = (t) =>
  useCallback(
    (key, fallback) =>
      t && typeof t === "object" && t[key] ? t[key] : fallback,
    [t],
  );

const useMenuSections = ({
  isPro,
  translate,
  onOpenSettings,
  onOpenUpgrade,
  onOpenLogout,
}) =>
  useMemo(() => {
    const primaryItems = [
      {
        key: "settings",
        icon: "cog-6-tooth",
        label: translate("settings", "Settings"),
        action: onOpenSettings,
        tone: "default",
      },
    ];

    if (!isPro) {
      primaryItems.unshift({
        key: "upgrade",
        icon: "shield-check",
        label: translate("upgrade", "Upgrade"),
        action: onOpenUpgrade,
        tone: "default",
      });
    }

    const exitItems = [
      {
        key: "logout",
        icon: "arrow-right-on-rectangle",
        label: translate("logout", "Logout"),
        action: onOpenLogout,
        tone: "danger",
      },
    ];

    return [
      { key: "primary", items: primaryItems },
      { key: "exit", items: exitItems },
    ];
  }, [isPro, onOpenLogout, onOpenSettings, onOpenUpgrade, translate]);

const renderSection = (section, index, totalSections, handleMenuAction) => (
  <Fragment key={section.key}>
    {section.items.map((item) => {
      const buttonClassName =
        item.tone === "danger"
          ? `${styles["menu-item"]} ${styles["menu-item-danger"]}`
          : styles["menu-item"];
      return (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          className={buttonClassName}
          onClick={handleMenuAction(item.action)}
        >
          <span className={styles["menu-item-leading"]} aria-hidden="true">
            <ThemeIcon
              name={item.icon}
              className={styles["menu-icon"]}
              width={20}
              height={20}
              tone="dark"
            />
          </span>
          <span className={styles["menu-label"]}>{item.label}</span>
        </button>
      );
    })}
    {index < totalSections - 1 ? (
      <div className={styles["menu-divider"]} aria-hidden="true" />
    ) : null}
  </Fragment>
);

function UserMenuDropdown({
  open,
  setOpen,
  t,
  isPro,
  onOpenSettings,
  onOpenUpgrade,
  onOpenLogout,
}) {
  const { rootRef, handleMenuAction } = useMenuClose(open, setOpen);
  const translate = useTranslate(t);
  const menuSections = useMenuSections({
    isPro,
    translate,
    onOpenSettings,
    onOpenUpgrade,
    onOpenLogout,
  });

  if (!open) return null;

  return (
    <div ref={rootRef} className={styles["user-menu-dropdown"]}>
      <div className={styles["menu-panel"]} role="menu">
        {menuSections.map((section, index) =>
          renderSection(section, index, menuSections.length, handleMenuAction),
        )}
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
