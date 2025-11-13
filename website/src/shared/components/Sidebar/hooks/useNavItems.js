import { useMemo } from "react";

export const NAVIGATION_KEYS = Object.freeze({
  DICTIONARY: "dictionary",
  LIBRARY: "library",
});

const ICON_NAMES = Object.freeze({
  DICTIONARY: "brand-glancy-website",
  LIBRARY: "library",
});

/**
 * 根据权限与文案生成侧边栏导航项数组。
 * 渲染层仅需负责 map，无需感知业务计算。
 */
export function useNavItems({
  access,
  labels,
  handlers,
  activeView,
}) {
  return useMemo(() => {
    const items = [];

    if (access.canAccessDictionary) {
      items.push({
        key: NAVIGATION_KEYS.DICTIONARY,
        label: labels.dictionary,
        icon: ICON_NAMES.DICTIONARY,
        onClick: handlers.onDictionary,
        active: activeView === NAVIGATION_KEYS.DICTIONARY,
        testId: "sidebar-nav-dictionary",
      });
    }

    if (access.canAccessLibrary) {
      items.push({
        key: NAVIGATION_KEYS.LIBRARY,
        label: labels.library,
        icon: ICON_NAMES.LIBRARY,
        onClick: handlers.onLibrary,
        active: activeView === NAVIGATION_KEYS.LIBRARY,
        testId: "sidebar-nav-library",
      });
    }

    return items;
  }, [
    access.canAccessDictionary,
    access.canAccessLibrary,
    activeView,
    handlers.onDictionary,
    handlers.onLibrary,
    labels.dictionary,
    labels.library,
  ]);
}

export default useNavItems;
