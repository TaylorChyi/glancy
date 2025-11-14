import { useCallback, useEffect, useRef } from "react";

const getNavigationIndex = (key, index, length) => {
  switch (key) {
    case "ArrowDown":
      return Math.min(index + 1, length - 1);
    case "ArrowUp":
      return Math.max(index - 1, 0);
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return undefined;
  }
};

export default function useHistoryNavigation(items = []) {
  const itemRefs = useRef([]);
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items.length]);
  const focusItemAt = useCallback((index) => {
    const target = itemRefs.current[index];
    if (target && typeof target.focus === "function") target.focus();
  }, []);
  const registerItemRef = useCallback((index) => (element) => {
    itemRefs.current[index] = element ?? null;
  }, []);
  return useCallback(
    (index) => ({
      ref: registerItemRef(index),
      onKeyDown: (event) => {
        if (!items.length) return;
        const nextIndex = getNavigationIndex(event.key, index, items.length);
        if (nextIndex === undefined) return;
        event.preventDefault();
        focusItemAt(nextIndex);
      },
    }),
    [focusItemAt, items.length, registerItemRef],
  );
}
