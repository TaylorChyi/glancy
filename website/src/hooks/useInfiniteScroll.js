import { useEffect } from "react";

const DEFAULT_THRESHOLD_PX = 64;

/**
 * 背景：
 *  - 侧边栏搜索历史的滚动加载此前由组件自行监听 scroll 事件，逻辑分散难以复用。
 * 目的：
 *  - 抽象成自定义 Hook 统一处理滚动阈值判断与回调触发，便于不同列表共享。
 * 关键决策与取舍：
 *  - 采用基于阈值的模板方法：内部固定滚动判断步骤，回调策略由调用方注入；
 *    若继续在组件中手写监听，将造成重复代码且难以测试。
 * 影响范围：
 *  - 目前用于 Sidebar 历史区块，未来可拓展到收藏等模块。
 * 演进与TODO：
 *  - 如需节流或交叉观察器，可在此 Hook 内扩展策略或加入配置项。
 */
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
