import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import { NAVIGATION_KEYS, useNavItems } from "../useNavItems.js";

const defaultHandlers = {
  onDictionary: jest.fn(),
  onLibrary: jest.fn(),
};

const defaultLabels = {
  dictionary: "Glancy",
  library: "Library",
};

/**
 * 测试目标：权限命中时应渲染全部导航项并保持激活态推导。
 */
test("Given full access When building nav items Then expose both entries", () => {
  const { result } = renderHook(() =>
    useNavItems({
      access: { canAccessDictionary: true, canAccessLibrary: true },
      labels: defaultLabels,
      handlers: defaultHandlers,
      activeView: NAVIGATION_KEYS.DICTIONARY,
    }),
  );

  expect(result.current).toHaveLength(2);
  expect(result.current[0]).toMatchObject({
    key: NAVIGATION_KEYS.DICTIONARY,
    label: "Glancy",
    active: true,
  });
  expect(result.current[1]).toMatchObject({
    key: NAVIGATION_KEYS.LIBRARY,
    label: "Library",
    active: false,
  });
});

/**
 * 测试目标：权限受限时应自动过滤无权访问的导航项。
 */
test("Given missing library access When building nav items Then omit entry", () => {
  const { result } = renderHook(() =>
    useNavItems({
      access: { canAccessDictionary: true, canAccessLibrary: false },
      labels: defaultLabels,
      handlers: defaultHandlers,
      activeView: NAVIGATION_KEYS.LIBRARY,
    }),
  );

  expect(result.current).toHaveLength(1);
  expect(result.current[0].key).toBe(NAVIGATION_KEYS.DICTIONARY);
});
