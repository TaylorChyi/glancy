import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useUser } from "@core/context";

export default function useSidebarHistory({ onSelectHistory } = {}) {
  const { history, loadHistory, loadMoreHistory, error, hasMore, isLoading } =
    useHistory();
  const { user } = useUser();
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    if (!user?.token) return;
    loadHistory(user);
  }, [loadHistory, user]);

  useEffect(() => {
    if (!error) return;
    setErrorMessage(error);
  }, [error]);

  const items = useMemo(
    () => (Array.isArray(history) ? history : []),
    [history],
  );

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

  const registerItemRef = useCallback(
    (index) => (element) => {
      itemRefs.current[index] = element ?? null;
    },
    [],
  );

  const onNavigate = useCallback(
    (index) => ({
      ref: registerItemRef(index),
      onKeyDown: (event) => handleNavigateKey(event, index),
    }),
    [handleNavigateKey, registerItemRef],
  );

  const handleLoadMore = useCallback(() => {
    if (!user?.token) return;
    loadMoreHistory(user);
  }, [loadMoreHistory, user]);

  const handleSelect = useCallback(
    (item) => {
      if (typeof onSelectHistory !== "function") return;
      const versionId = item?.latestVersionId ?? undefined;
      onSelectHistory(item, versionId);
    },
    [onSelectHistory],
  );

  const handleToastClose = useCallback(() => {
    setErrorMessage("");
  }, []);

  const toast = useMemo(
    () => ({
      open: Boolean(errorMessage),
      message: errorMessage,
      onClose: handleToastClose,
    }),
    [errorMessage, handleToastClose],
  );

  return {
    items,
    onSelect: handleSelect,
    onNavigate,
    toast,
    hasMore,
    isLoading,
    loadMore: handleLoadMore,
  };
}
