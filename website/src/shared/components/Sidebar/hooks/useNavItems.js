import { useMemo } from "react";

export const NAVIGATION_KEYS = Object.freeze({
  DICTIONARY: "dictionary",
  LIBRARY: "library",
});

const ICON_NAMES = Object.freeze({
  DICTIONARY: "brand-glancy-website",
  LIBRARY: "library",
});

const ITEM_BUILDERS = Object.freeze({
  [NAVIGATION_KEYS.DICTIONARY]: ({ labels, handlers, activeView }) => ({
    key: NAVIGATION_KEYS.DICTIONARY,
    label: labels.dictionary,
    icon: ICON_NAMES.DICTIONARY,
    onClick: handlers.onDictionary,
    active: activeView === NAVIGATION_KEYS.DICTIONARY,
    testId: "sidebar-nav-dictionary",
  }),
  [NAVIGATION_KEYS.LIBRARY]: ({ labels, handlers, activeView }) => ({
    key: NAVIGATION_KEYS.LIBRARY,
    label: labels.library,
    icon: ICON_NAMES.LIBRARY,
    onClick: handlers.onLibrary,
    active: activeView === NAVIGATION_KEYS.LIBRARY,
    testId: "sidebar-nav-library",
  }),
});

const ITEM_DESCRIPTORS = [
  {
    key: NAVIGATION_KEYS.DICTIONARY,
    isAccessible: (access) => Boolean(access.canAccessDictionary),
  },
  {
    key: NAVIGATION_KEYS.LIBRARY,
    isAccessible: (access) => Boolean(access.canAccessLibrary),
  },
];

export const buildNavItems = ({ access, labels, handlers, activeView }) =>
  ITEM_DESCRIPTORS.filter(({ isAccessible }) => isAccessible(access)).map(
    ({ key }) =>
      ITEM_BUILDERS[key]({
        labels,
        handlers,
        activeView,
      }),
  );

/**
 * 根据权限与文案生成侧边栏导航项数组。
 * 渲染层仅需负责 map，无需感知业务计算。
 */
export function useNavItems({ access, labels, handlers, activeView }) {
  return useMemo(
    () => buildNavItems({ access, labels, handlers, activeView }),
    [
      access,
      labels,
      handlers,
      activeView,
    ],
  );
}

export default useNavItems;
