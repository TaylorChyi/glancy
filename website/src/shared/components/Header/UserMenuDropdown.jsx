import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./Header.module.css";

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

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, setOpen]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleMenuAction = useCallback(
    (callback) => () => {
      if (typeof callback === "function") {
        callback();
      }
      closeMenu();
    },
    [closeMenu],
  );

  const translate = useCallback(
    (key, fallback) => {
      if (!t || typeof t !== "object") return fallback;
      return t[key] || fallback;
    },
    [t],
  );

  /**
   * 背景：
   *  - 帮助入口下线后，菜单仍需保持可拓展性，以支持未来新增能力。
   * 关键决策与取舍：
   *  - 采用“组合模式”描述菜单分区，统一通过配置驱动渲染，避免硬编码按钮顺序。
   *  - 替代方案是写死 JSX 结构，但那会在新增按钮时重复修改多处代码且易出现顺序差异。
   */
  const menuSections = useMemo(() => {
    const primaryItems = [];

    if (!isPro) {
      primaryItems.push({
        key: "upgrade",
        icon: "shield-check",
        label: translate("upgrade", "Upgrade"),
        action: onOpenUpgrade,
        tone: "default",
      });
    }

    primaryItems.push({
      key: "settings",
      icon: "cog-6-tooth",
      label: translate("settings", "Settings"),
      action: onOpenSettings,
      tone: "default",
    });

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

  if (!open) {
    return null;
  }

  return (
    <div ref={rootRef} className={styles["user-menu-dropdown"]}>
      <div className={styles["menu-panel"]} role="menu">
        {menuSections.map((section, sectionIndex) => (
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
                  <span
                    className={styles["menu-item-leading"]}
                    aria-hidden="true"
                  >
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
            {sectionIndex < menuSections.length - 1 ? (
              <div className={styles["menu-divider"]} aria-hidden="true" />
            ) : null}
          </Fragment>
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
