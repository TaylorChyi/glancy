import useHistoryLoading from "./useHistoryLoading.js";
import useHistoryNavigation from "./useHistoryNavigation.js";
import useHistoryToast from "./useHistoryToast.js";

export { default as useHistoryLoading } from "./useHistoryLoading.js";
export { default as useHistoryNavigation } from "./useHistoryNavigation.js";
export { default as useHistoryToast } from "./useHistoryToast.js";

export default function useSidebarHistory({ onSelectHistory } = {}) {
  const { items, onSelect, loadMore, hasMore, isLoading, error } =
    useHistoryLoading({ onSelectHistory });
  const onNavigate = useHistoryNavigation(items);
  const toast = useHistoryToast(error);

  return {
    items,
    onSelect,
    onNavigate,
    toast,
    hasMore,
    isLoading,
    loadMore,
  };
}
