import { useEffect } from "react";

const DEFAULT_THRESHOLD_PX = 64;


export default function useInfiniteScroll({
  containerRef,
  onLoadMore,
  hasMore,
  isLoading,
  threshold = DEFAULT_THRESHOLD_PX,
}) {
  useEffect(() => {
    const node = containerRef?.current;
    if (!node) return;

    const handleScroll = () => {
      if (!hasMore || isLoading || typeof onLoadMore !== "function") {
        return;
      }
      const distanceToBottom =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      if (distanceToBottom <= threshold) {
        onLoadMore();
      }
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, hasMore, isLoading, onLoadMore, threshold]);
}
