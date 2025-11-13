import { useCallback, useEffect, useMemo } from "react";
import { useHistory, useUser } from "@core/context";

export default function useHistoryLoading({ onSelectHistory } = {}) {
  const { history, loadHistory, loadMoreHistory, error, hasMore, isLoading } =
    useHistory();
  const { user } = useUser();

  useEffect(() => {
    if (!user?.token) return;
    loadHistory(user);
  }, [loadHistory, user]);

  const items = useMemo(
    () => (Array.isArray(history) ? history : []),
    [history],
  );

  const loadMore = useCallback(() => {
    if (!user?.token) return;
    loadMoreHistory(user);
  }, [loadMoreHistory, user]);

  const onSelect = useCallback(
    (item) => {
      if (typeof onSelectHistory !== "function") return;
      const versionId = item?.latestVersionId ?? undefined;
      onSelectHistory(item, versionId);
    },
    [onSelectHistory],
  );

  return {
    items,
    onSelect,
    loadMore,
    hasMore,
    isLoading,
    error,
  };
}
