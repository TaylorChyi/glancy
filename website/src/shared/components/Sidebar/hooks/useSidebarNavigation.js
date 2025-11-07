import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@core/context";
// 避免通过 utils/index 的桶状导出造成 rollup chunk 循环，直接引用具体实现。
import { useIsMobile } from "@shared/utils/device.js";

const NAVIGATION_KEYS = {
  DICTIONARY: "dictionary",
  LIBRARY: "library",
};

const ICON_NAMES = Object.freeze({
  // 采用品牌版主图标以保持导航与站点品牌一致，避免多处手动维护别名。
  DICTIONARY: "brand-glancy-website",
  LIBRARY: "library",
});

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
        icon: ICON_NAMES.DICTIONARY,
        onClick: handleDictionary,
        active: activeView === NAVIGATION_KEYS.DICTIONARY,
        testId: "sidebar-nav-dictionary",
      },
      {
        key: NAVIGATION_KEYS.LIBRARY,
        label: libraryLabel,
        icon: ICON_NAMES.LIBRARY,
        onClick: handleLibrary,
        active: activeView === NAVIGATION_KEYS.LIBRARY,
        testId: "sidebar-nav-library",
      },
    ],
    [
      activeView,
      dictionaryLabel,
      libraryLabel,
      handleDictionary,
      handleLibrary,
    ],
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
