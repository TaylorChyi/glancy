import { useRef } from "react";
import ThemeIcon from "@/components/ui/Icon";
import { useOutsideToggle } from "@/hooks";
import useMenuNavigation from "@/hooks/useMenuNavigation.js";
import { withStopPropagation } from "@/utils/stopPropagation.js";
import styles from "./ItemMenu.module.css";

function ItemMenu({ onFavorite, onDelete, favoriteLabel, deleteLabel }) {
  const { open, setOpen, ref: wrapperRef } = useOutsideToggle(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  const handleTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (!items || items.length === 0) return;
        const index = e.key === "ArrowUp" ? items.length - 1 : 0;
        items[index]?.querySelector("button, [href], [tabindex]")?.focus();
      });
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.action}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={withStopPropagation(() => {
          setOpen(!open);
        })}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
      >
        <ThemeIcon name="ellipsis-vertical" width={16} height={16} />
      </button>
      {open && (
        <ul className={styles.menu} role="menu" ref={menuRef}>
          <li role="menuitem">
            <button
              type="button"
              onClick={withStopPropagation(() => {
                onFavorite();
                setOpen(false);
              })}
            >
              <ThemeIcon
                name="star-solid"
                width={16}
                height={16}
                className={styles.icon}
              />{" "}
              {favoriteLabel}
            </button>
          </li>
          <li role="menuitem">
            <button
              type="button"
              className={styles["delete-btn"]}
              onClick={withStopPropagation(() => {
                onDelete();
                setOpen(false);
              })}
            >
              <ThemeIcon
                name="trash"
                width={16}
                height={16}
                className={styles.icon}
              />{" "}
              {deleteLabel}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default ItemMenu;
