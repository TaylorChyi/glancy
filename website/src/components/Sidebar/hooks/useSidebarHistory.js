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
import { shallow } from "zustand/shallow";
import { useHistory, useUser } from "@/context";
import { useWordStore } from "@/store";

const sanitizeTerm = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
};

/**
 * 意图：以适配器模式将词条缓存中的规范词形映射到历史项，用于侧边栏展示。
 * 输入：历史项、wordStore 暴露的 getEntry/getRecord 访问器。
 * 输出：用于展示的规范词形字符串，若无法解析则返回空串。
 * 流程：
 *  1) 优先读取词条版本（getEntry）对应的 term；
 *  2) 其次回退到缓存元数据或任一包含 term 的版本；
 *  3) 若仍未命中，则退回历史项原始 term。
 * 错误处理：缺失访问器或字段时返回空串，调用方负责回退；
 * 复杂度：O(1)。
 */
const resolveDisplayTerm = (item, getEntry, getRecord) => {
  if (!item) return "";

  const preferredEntry =
    typeof getEntry === "function"
      ? getEntry(item.termKey, item.latestVersionId ?? undefined)
      : null;
  const entryTerm = sanitizeTerm(preferredEntry?.term);
  if (entryTerm) {
    return entryTerm;
  }

  const record =
    typeof getRecord === "function" ? getRecord(item.termKey) : null;
  if (record) {
    const metadataTerm = sanitizeTerm(record.metadata?.term);
    if (metadataTerm) {
      return metadataTerm;
    }

    if (Array.isArray(record.versions)) {
      const matchedVersion = record.versions.find((version) => {
        if (!version) return false;
        if (item.latestVersionId) {
          return (
            String(version.id) === String(item.latestVersionId) &&
            sanitizeTerm(version.term)
          );
        }
        return Boolean(sanitizeTerm(version.term));
      });
      const versionTerm = sanitizeTerm(matchedVersion?.term);
      if (versionTerm) {
        return versionTerm;
      }
    }
  }

  return sanitizeTerm(item.term);
};

export default function useSidebarHistory({ onSelectHistory } = {}) {
  const { history, loadHistory, loadMoreHistory, error, hasMore, isLoading } =
    useHistory();
  const { user } = useUser();
  const [errorMessage, setErrorMessage] = useState("");
  const { getEntry, getRecord } = useWordStore(
    (state) => ({
      getEntry: state.getEntry,
      getRecord: state.getRecord,
    }),
    shallow,
  );

  useEffect(() => {
    if (!user?.token) return;
    loadHistory(user);
  }, [loadHistory, user]);

  useEffect(() => {
    if (!error) return;
    setErrorMessage(error);
  }, [error]);

  const items = useMemo(() => {
    if (!Array.isArray(history)) {
      return [];
    }

    let hasAdaptedTerm = false;
    const adapted = history.map((item) => {
      const canonicalTerm = resolveDisplayTerm(item, getEntry, getRecord);
      if (canonicalTerm && canonicalTerm !== item.term) {
        hasAdaptedTerm = true;
        return { ...item, displayTerm: canonicalTerm };
      }
      return item;
    });

    return hasAdaptedTerm ? adapted : history;
  }, [getEntry, getRecord, history]);

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
