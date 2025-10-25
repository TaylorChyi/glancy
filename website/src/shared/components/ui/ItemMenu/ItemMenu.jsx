import { useCallback, useRef, useState } from "react";
import ThemeIcon from "@shared/components/ui/Icon";
import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";
import Popover from "@shared/components/ui/Popover/Popover.jsx";
import { withStopPropagation } from "@shared/utils/stopPropagation.js";
import styles from "./ItemMenu.module.css";

function ItemMenu({ onDelete, deleteLabel }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

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
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.action}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={withStopPropagation(() => {
          setOpen((current) => !current);
        })}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
      >
        <ThemeIcon name="ellipsis-vertical" width={16} height={16} />
      </button>
      <Popover
        isOpen={open}
        anchorRef={triggerRef}
        onClose={closeMenu}
        placement="bottom"
        align="end"
        offset={4}
      >
        {open && (
          <ul className={styles.menu} role="menu" ref={menuRef}>
            <li role="menuitem">
              <button
                type="button"
                className={styles["delete-btn"]}
                onClick={withStopPropagation(() => {
                  onDelete();
                  closeMenu();
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
      </Popover>
    </div>
  );
}

export default ItemMenu;
