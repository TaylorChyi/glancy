import { useCallback, useRef, useState } from "react";
import ThemeIcon from "@shared/components/ui/Icon";
import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";
import Popover from "@shared/components/ui/Popover/Popover.jsx";
import { withStopPropagation } from "@shared/utils/stopPropagation.js";
import styles from "./ItemMenu.module.css";

const focusMenuItem = (menuRef, key) => {
  const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
  if (!items || items.length === 0) return;
  const index = key === "ArrowUp" ? items.length - 1 : 0;
  items[index]?.querySelector("button, [href], [tabindex]")?.focus();
};

const handleMenuTriggerKeyDown = (event, setOpen, menuRef) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  setOpen(true);
  requestAnimationFrame(() => focusMenuItem(menuRef, event.key));
};

function MenuActionItem({ className, icon, label, onClick }) {
  return (
    <li role="menuitem">
      <button
        type="button"
        className={className}
        onClick={withStopPropagation(onClick)}
      >
        <ThemeIcon name={icon} width={16} height={16} className={styles.icon} />{" "}
        {label}
      </button>
    </li>
  );
}

function ItemMenuContent({
  menuRef,
  onFavorite,
  onDelete,
  favoriteLabel,
  deleteLabel,
  closeMenu,
}) {
  const actions = [
    {
      key: "favorite",
      handler: () => {
        onFavorite();
        closeMenu();
      },
      icon: "star-solid",
      label: favoriteLabel,
    },
    {
      key: "delete",
      handler: () => {
        onDelete();
        closeMenu();
      },
      icon: "trash",
      label: deleteLabel,
      className: styles["delete-btn"],
    },
  ];

  return (
    <ul className={styles.menu} role="menu" ref={menuRef}>
      {actions.map((action) => (
        <MenuActionItem
          key={action.key}
          className={action.className}
          icon={action.icon}
          label={action.label}
          onClick={action.handler}
        />
      ))}
    </ul>
  );
}

function ItemMenuTrigger({
  open,
  toggleMenu,
  handleTriggerKeyDown,
  triggerRef,
}) {
  return (
    <button
      type="button"
      className={styles.action}
      aria-haspopup="true"
      aria-expanded={open}
      onClick={withStopPropagation(toggleMenu)}
      onKeyDown={handleTriggerKeyDown}
      ref={triggerRef}
    >
      <ThemeIcon name="ellipsis-vertical" width={16} height={16} />
    </button>
  );
}

function ItemMenuPopover({
  open,
  triggerRef,
  menuRef,
  closeMenu,
  onFavorite,
  onDelete,
  favoriteLabel,
  deleteLabel,
}) {
  return (
    <Popover
      isOpen={open}
      anchorRef={triggerRef}
      onClose={closeMenu}
      placement="bottom"
      align="end"
      offset={4}
    >
      {open && (
        <ItemMenuContent
          menuRef={menuRef}
          onFavorite={onFavorite}
          onDelete={onDelete}
          favoriteLabel={favoriteLabel}
          deleteLabel={deleteLabel}
          closeMenu={closeMenu}
        />
      )}
    </Popover>
  );
}

function ItemMenuView({
  open,
  triggerRef,
  menuRef,
  closeMenu,
  toggleMenu,
  handleTriggerKeyDown,
  onFavorite,
  onDelete,
  favoriteLabel,
  deleteLabel,
}) {
  return (
    <div className={styles.wrapper}>
      <ItemMenuTrigger
        open={open}
        toggleMenu={toggleMenu}
        handleTriggerKeyDown={handleTriggerKeyDown}
        triggerRef={triggerRef}
      />
      <ItemMenuPopover
        open={open}
        triggerRef={triggerRef}
        menuRef={menuRef}
        closeMenu={closeMenu}
        onFavorite={onFavorite}
        onDelete={onDelete}
        favoriteLabel={favoriteLabel}
        deleteLabel={deleteLabel}
      />
    </div>
  );
}

function ItemMenu({ onFavorite, onDelete, favoriteLabel, deleteLabel }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((current) => !current), []);
  const handleTriggerKeyDown = useCallback(
    (event) => handleMenuTriggerKeyDown(event, setOpen, menuRef),
    [menuRef]
  );

  return (
    <ItemMenuView
      open={open}
      triggerRef={triggerRef}
      menuRef={menuRef}
      closeMenu={closeMenu}
      toggleMenu={toggleMenu}
      handleTriggerKeyDown={handleTriggerKeyDown}
      onFavorite={onFavorite}
      onDelete={onDelete}
      favoriteLabel={favoriteLabel}
      deleteLabel={deleteLabel}
    />
  );
}

export default ItemMenu;
