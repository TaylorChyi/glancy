import type { KeyboardEvent, RefObject } from "react";
import ThemeIcon from "@/components/ui/Icon";
import type { SubmenuItem } from "./types";
import styles from "./UserMenu.module.css";

type UserSubmenuProps = {
  open: boolean;
  anchorTop: number;
  side: "above" | "below";
  items: SubmenuItem[];
  submenuRef: RefObject<HTMLDivElement>;
  activeItemId: string | null;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onItemActivate: (id: string) => void;
  onItemSelect: (
    item: SubmenuItem,
    options?: { viaKeyboard?: boolean },
  ) => void;
  registerItem: (id: string, node: HTMLElement | null) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function UserSubmenu({
  open,
  anchorTop,
  side,
  items,
  submenuRef,
  activeItemId,
  onKeyDown,
  onItemActivate,
  onItemSelect,
  registerItem,
  onMouseEnter,
  onMouseLeave,
}: UserSubmenuProps) {
  return (
    <div
      ref={submenuRef}
      role="menu"
      aria-orientation="vertical"
      className={styles.submenu}
      data-open={open || undefined}
      data-side={side}
      style={{ top: anchorTop }}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles["submenu-list"]}>
        {items.map((item) => {
          const isActive = activeItemId === item.id;
          const sharedProps = {
            key: item.id,
            ref: (node: HTMLElement | null) => registerItem(item.id, node),
            className: styles["submenu-item"],
            role: "menuitem" as const,
            tabIndex: 0,
            "data-active": isActive || undefined,
            onFocus: () => onItemActivate(item.id),
            onMouseEnter: () => onItemActivate(item.id),
          };

          const content = (
            <>
              {item.icon ? (
                <span className={styles["menu-icon"]} aria-hidden="true">
                  <ThemeIcon name={item.icon} width={20} height={20} />
                </span>
              ) : null}
              <span className={styles["menu-label"]}>{item.label}</span>
              {item.secondary ? (
                <span className={styles["menu-secondary"]}>
                  {item.secondary}
                </span>
              ) : null}
            </>
          );

          if (item.href) {
            return (
              <a
                {...sharedProps}
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noreferrer" : undefined}
                onClick={(event) => {
                  const viaKeyboard = event.detail === 0;
                  if (viaKeyboard) {
                    event.preventDefault();
                  }
                  onItemSelect(item, { viaKeyboard });
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
                onItemSelect(item, { viaKeyboard: event.detail === 0 });
              }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default UserSubmenu;
