import { useEffect } from "react";

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
    if (!menuEl) return undefined;

    const items = Array.from(
      menuEl.querySelectorAll(
        '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]',
      ),
    );
    if (!items.length) return undefined;

    const getFocusable = (item) => {
      if (!item) return undefined;
      if (typeof item.matches === "function") {
        if (item.matches("button, [href], [tabindex]")) {
          return item;
        }
      }
      return item.querySelector?.("button, [href], [tabindex]");
    };

    getFocusable(items[0])?.focus();

    const handleKeyDown = (e) => {
      const currentItem = e.target.closest(
        '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]',
      );
      const index = items.indexOf(currentItem);
      switch (e.key) {
        case "Escape":
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          getFocusable(items[(index + 1) % items.length])?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          getFocusable(
            items[(index - 1 + items.length) % items.length],
          )?.focus();
          break;
        default:
          break;
      }
    };

    menuEl.addEventListener("keydown", handleKeyDown);
    return () => menuEl.removeEventListener("keydown", handleKeyDown);
  }, [open, menuRef, triggerRef, setOpen]);
}
