import { useEffect } from "react";

const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

function collectMenuItems(menuEl) {
  if (!menuEl) return [];
  return Array.from(menuEl.querySelectorAll(MENU_ITEM_SELECTOR));
}

function focusMenuItem(item) {
  if (!item) return;
  if (typeof item.matches === "function" && item.matches("button, [href], [tabindex]")) {
    item.focus();
    return;
  }

  const focusable = item.querySelector?.("button, [href], [tabindex]");
  focusable?.focus();
}

function handleMenuKeyDown(event, { items, triggerRef, setOpen }) {
  const currentItem = event.target.closest(MENU_ITEM_SELECTOR);
  const index = items.indexOf(currentItem);

  switch (event.key) {
    case "Escape":
      setOpen(false);
      triggerRef.current?.focus();
      break;
    case "ArrowDown":
      event.preventDefault();
      focusMenuItem(items[(index + 1) % items.length]);
      break;
    case "ArrowUp":
      event.preventDefault();
      focusMenuItem(items[(index - 1 + items.length) % items.length]);
      break;
    default:
      break;
  }
}

/**
 * Menu keyboard navigation and accessibility management.
 * Focuses first item on open and supports Arrow/Escape keys.
 * @param {boolean} open - menu open state
 * @param {React.RefObject<HTMLElement>} menuRef - ref to menu element
 * @param {React.RefObject<HTMLElement>} triggerRef - ref to trigger button
 * @param {Function} setOpen - state setter to control menu visibility
 */
export default function useMenuNavigation(open, menuRef, triggerRef, setOpen) {
  useEffect(() => {
    if (!open) return undefined;

    const menuEl = menuRef.current;
    const items = collectMenuItems(menuEl);
    if (!items.length) return undefined;

    focusMenuItem(items[0]);

    const handleKeyDown = (event) =>
      handleMenuKeyDown(event, { items, triggerRef, setOpen });

    menuEl.addEventListener("keydown", handleKeyDown);
    return () => menuEl.removeEventListener("keydown", handleKeyDown);
  }, [open, menuRef, triggerRef, setOpen]);
}
