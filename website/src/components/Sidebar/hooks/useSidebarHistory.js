/**
 * 背景：
 *  - 历史列表此前直接在展示组件内访问上下文并操控副作用，导致容器与视图耦合严重。
 * 目的：
 *  - 聚合历史数据请求、错误提示与键盘导航策略，向展示层输出纯数据与回调。
 * 关键决策与取舍：
 *  - 采用自定义 Hook 实现领域逻辑内聚，返回稳定的事件处理器；若继续在组件内分散处理，
 *    难以编写针对副作用的单测，亦不利于未来接入不同展示形态。
 * 影响范围：
 *  - Sidebar 历史区块改为依赖该 Hook，其他模块无直接影响；上下文 API 未变化。
 * 演进与TODO：
 *  - 未来可在此 Hook 扩展分页、过滤或空状态配置，并通过返回值暴露给展示层。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useUser } from "@/context";

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

  const items = useMemo(() => (Array.isArray(history) ? history : []), [history]);

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
