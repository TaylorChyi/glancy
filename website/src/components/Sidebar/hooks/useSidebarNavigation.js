/**
 * 背景：
 *  - 现有 Sidebar 组件同时承担状态管理与展示渲染，扩展移动端行为与按钮配置成本较高。
 * 目的：
 *  - 提供容器层的导航数据与交互封装，配合拆分出的展示组件实现“容器 + 展示”模式。
 * 关键决策与取舍：
 *  - 采用自定义 Hook 聚合移动端开闭与按钮文案，避免在容器组件中重复推导；
 *    若直接在组件内编写逻辑，会让未来扩展（新增按钮、动态配置）时难以复用。
 *  - 保留对受控/非受控两种 open 形态的支持，以兼容现有调用方；替代方案是强制受控，
 *    但会破坏当前 API，故放弃。
 * 影响范围：
 *  - Sidebar 容器改为依赖该 Hook 获取渲染所需数据，其他调用方透传原有 props 即可。
 * 演进与TODO：
 *  - 后续可将导航项改由配置中心或远端下发，此 Hook 只需扩展数据来源即可。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context";
import { useIsMobile } from "@/utils";

const NAVIGATION_KEYS = {
  DICTIONARY: "dictionary",
  LIBRARY: "library",
};

/**
 * 意图：集中管理侧边栏导航所需的状态、文案与回调，输出给展示组件。
 * 输入：调用方可透传是否移动端、开闭状态、关闭回调、两个业务动作以及当前激活视图。
 * 输出：返回移动端开闭状态、导航按钮配置、分组辅助文案以及开闭控制方法。
 * 流程：
 *  1) 根据上下文语言环境推导导航、历史、词条等文案。
 *  2) 依据是否受控决定开闭状态维护方式。
 *  3) 生成导航按钮数组，统一处理点击后的收起逻辑。
 * 错误处理：无额外错误分支，全部依赖调用方传入的回调。
 * 复杂度：O(1)，只进行常量级计算。
 */
export default function useSidebarNavigation({
  isMobile: isMobileProp,
  open: openProp,
  onClose,
  onShowDictionary,
  onShowLibrary,
  activeView,
}) {
  const defaultMobile = useIsMobile();
  const isMobile = isMobileProp ?? defaultMobile;

  const [internalOpen, setInternalOpen] = useState(Boolean(openProp));
  const isControlled = typeof openProp === "boolean";

  useEffect(() => {
    if (isControlled) return;
    if (typeof openProp === "boolean") {
      setInternalOpen(openProp);
    }
  }, [isControlled, openProp]);

  const resolvedOpen = isControlled ? Boolean(openProp) : internalOpen;

  const closeSidebar = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
      return;
    }
    if (!isControlled) {
      setInternalOpen(false);
    }
  }, [isControlled, onClose]);

  const openSidebar = useCallback(() => {
    if (isControlled) return;
    setInternalOpen(true);
  }, [isControlled]);

  const { t, lang } = useLanguage();

  const headerLabel = useMemo(() => {
    if (t.sidebarNavigationLabel) return t.sidebarNavigationLabel;
    return lang === "zh" ? "导航" : "Navigation";
  }, [lang, t.sidebarNavigationLabel]);

  const dictionaryLabel = useMemo(
    () => t.primaryNavDictionaryLabel || "Glancy",
    [t.primaryNavDictionaryLabel],
  );

  const libraryLabel = useMemo(() => {
    if (t.primaryNavLibraryLabel) return t.primaryNavLibraryLabel;
    if (t.favorites) return t.favorites;
    if (t.primaryNavEntriesLabel) return t.primaryNavEntriesLabel;
    return "Library";
  }, [t.favorites, t.primaryNavEntriesLabel, t.primaryNavLibraryLabel]);

  const historyLabel = useMemo(() => {
    if (t.searchHistory) return t.searchHistory;
    return lang === "zh" ? "搜索记录" : "History";
  }, [lang, t.searchHistory]);

  const entriesLabel = useMemo(() => {
    if (t.primaryNavEntriesLabel) return t.primaryNavEntriesLabel;
    return lang === "zh" ? "词条" : "Entries";
  }, [lang, t.primaryNavEntriesLabel]);

  const handleDictionary = useCallback(() => {
    if (typeof onShowDictionary === "function") {
      onShowDictionary();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
    if (isMobile) {
      closeSidebar();
    }
  }, [closeSidebar, isMobile, onShowDictionary]);

  const handleLibrary = useCallback(() => {
    if (typeof onShowLibrary === "function") {
      onShowLibrary();
    }
    if (isMobile) {
      closeSidebar();
    }
  }, [closeSidebar, isMobile, onShowLibrary]);

  const navigationActions = useMemo(
    () => [
      {
        key: NAVIGATION_KEYS.DICTIONARY,
        label: dictionaryLabel,
        icon: "glancy-web",
        onClick: handleDictionary,
        active: activeView === NAVIGATION_KEYS.DICTIONARY,
        testId: "sidebar-nav-dictionary",
      },
      {
        key: NAVIGATION_KEYS.LIBRARY,
        label: libraryLabel,
        icon: "library",
        onClick: handleLibrary,
        active: activeView === NAVIGATION_KEYS.LIBRARY,
        testId: "sidebar-nav-library",
      },
    ],
    [activeView, dictionaryLabel, libraryLabel, handleDictionary, handleLibrary],
  );

  const shouldShowOverlay = isMobile && resolvedOpen;

  return {
    isMobile,
    isOpen: resolvedOpen,
    shouldShowOverlay,
    openSidebar,
    closeSidebar,
    headerLabel,
    navigationActions,
    historyLabel,
    entriesLabel,
  };
}
