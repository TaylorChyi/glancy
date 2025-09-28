import { Fragment } from "react";
import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import Avatar from "@/components/ui/Avatar";
import ThemeIcon from "@/components/ui/Icon";
import type { MenuEntry } from "./types";
import styles from "./UserMenu.module.css";

type UserMenuProps = {
  id: string;
  entries: MenuEntry[];
  activeItemId: string | null;
  submenuOpenId: string | null;
  side: "above" | "below";
  menuRef: RefObject<HTMLDivElement>;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onItemActivate: (id: string) => void;
  onItemSelect: (entry: Extract<MenuEntry, { type: "item" }>) => void;
  onRequestSubmenu: (
    entry: Extract<MenuEntry, { type: "item" }>,
    target: HTMLElement,
  ) => void;
  onCloseSubmenu: () => void;
  registerItem: (id: string, node: HTMLElement | null) => void;
};

function renderProfile(entry: Extract<MenuEntry, { type: "profile" }>) {
  return (
    <div className={styles.profile}>
      <Avatar
        width={36}
        height={36}
        className={styles["profile-avatar"]}
        aria-hidden="true"
      />
      <div className={styles["profile-info"]}>
        <span className={styles["profile-name"]}>{entry.name}</span>
        {entry.plan ? (
          <span className={styles["profile-plan"]}>{entry.plan}</span>
        ) : null}
      </div>
    </div>
  );
}

function UserMenu({
  id,
  entries,
  activeItemId,
  submenuOpenId,
  side,
  menuRef,
  onKeyDown,
  onItemActivate,
  onItemSelect,
  onRequestSubmenu,
  onCloseSubmenu,
  registerItem,
}: UserMenuProps) {
  return (
    <div
      id={id}
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      className={styles.panel}
      data-side={side}
      onKeyDown={onKeyDown}
    >
      <div className={styles["menu-list"]}>
        {entries.map((entry) => {
          if (entry.type === "profile") {
            return <Fragment key={entry.id}>{renderProfile(entry)}</Fragment>;
          }

          if (entry.type === "groupLabel") {
            return (
              <p key={entry.id} className={styles["group-label"]}>
                {entry.label}
              </p>
            );
          }

          if (entry.type === "divider") {
            return <div key={entry.id} className={styles["menu-divider"]} />;
          }

          if (entry.type === "item") {
            const isActive = activeItemId === entry.id;
            const hasSubmenu = Boolean(entry.submenu);
            const sharedProps = {
              key: entry.id,
              ref: (node: HTMLButtonElement | HTMLAnchorElement | null) =>
                registerItem(entry.id, node),
              className: styles["menu-item"],
              role: "menuitem" as const,
              tabIndex: 0,
              "data-active": isActive || undefined,
              "data-has-submenu": hasSubmenu || undefined,
              "aria-haspopup": hasSubmenu ? "menu" : undefined,
              "aria-expanded": hasSubmenu
                ? submenuOpenId === entry.id
                : undefined,
              onFocus: () => onItemActivate(entry.id),
              onMouseEnter: (event: MouseEvent<HTMLElement>) => {
                onItemActivate(entry.id);
                if (hasSubmenu) {
                  onRequestSubmenu(entry, event.currentTarget as HTMLElement);
                }
              },
              onMouseLeave: () => {
                if (hasSubmenu) {
                  onCloseSubmenu();
                }
              },
            };

            const content = (
              <>
                {entry.icon ? (
                  <span className={styles["menu-icon"]} aria-hidden="true">
                    <ThemeIcon name={entry.icon} width={20} height={20} />
                  </span>
                ) : null}
                <span className={styles["menu-label"]}>{entry.label}</span>
                {entry.secondary ? (
                  <span className={styles["menu-secondary"]}>
                    {entry.secondary}
                  </span>
                ) : null}
                {hasSubmenu ? (
                  <span className={styles["menu-arrow"]} aria-hidden="true">
                    <ThemeIcon name="chevron-right" width={16} height={16} />
                  </span>
                ) : null}
              </>
            );

            if (entry.href) {
              return (
                <a
                  {...sharedProps}
                  href={entry.href}
                  target={entry.target}
                  rel={entry.target === "_blank" ? "noreferrer" : undefined}
                  onClick={(event) => {
                    const viaKeyboard = event.detail === 0;
                    if (viaKeyboard) {
                      event.preventDefault();
                    }
                    onItemSelect(entry, { viaKeyboard });
                  }}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                {...sharedProps}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onItemSelect(entry, { viaKeyboard: event.detail === 0 });
                }}
              >
                {content}
              </button>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

export default UserMenu;
