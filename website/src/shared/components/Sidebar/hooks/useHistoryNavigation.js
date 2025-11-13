import { useCallback, useEffect, useRef } from "react";

export default function useHistoryNavigation(items = []) {
  const itemRefs = useRef([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items.length]);

  const focusItemAt = useCallback((index) => {
    const target = itemRefs.current[index];
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }, []);

  const registerItemRef = useCallback(
    (index) => (element) => {
      itemRefs.current[index] = element ?? null;
    },
    [],
  );

  const handleNavigateKey = useCallback(
    (event, index) => {
      if (items.length === 0) return;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          focusItemAt(Math.min(index + 1, items.length - 1));
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          focusItemAt(Math.max(index - 1, 0));
          break;
        }
        case "Home": {
          event.preventDefault();
          focusItemAt(0);
          break;
        }
        case "End": {
          event.preventDefault();
          focusItemAt(items.length - 1);
          break;
        }
        default:
          break;
      }
    },
    [focusItemAt, items.length],
  );

  return useCallback(
    (index) => ({
      ref: registerItemRef(index),
      onKeyDown: (event) => handleNavigateKey(event, index),
    }),
    [handleNavigateKey, registerItemRef],
  );
}
