import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockUseLanguage = jest.fn(() => ({
  t: {
    primaryNavDictionaryLabel: "Dictionary",
  },
  lang: "en",
}));
const mockUseUser = jest.fn(() => ({ user: null }));

const mockUseIsMobile = jest.fn(() => false);

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: mockUseLanguage,
  useUser: mockUseUser,
}));

jest.unstable_mockModule("@shared/utils/device.js", () => ({
  useIsMobile: mockUseIsMobile,
}));

let useSidebarNavigation;

beforeAll(async () => {
  ({ default: useSidebarNavigation } = await import(
    "../useSidebarNavigation.js"
  ));
});

describe("useSidebarNavigation", () => {
  beforeEach(() => {
    mockUseLanguage.mockClear();
    mockUseUser.mockClear();
    mockUseIsMobile.mockClear();
  });

  /**
   * 测试目标：词典导航项应绑定品牌主图标以维持视觉一致性。
   * 前置条件：语言上下文返回词典文案，设备判断为非移动端。
   * 步骤：
   *  1) 调用 useSidebarNavigation 钩子。
   *  2) 解析返回的 navigationActions。
   * 断言：
   *  - 词典项 icon 字段等于 brand-glancy-website（失败信息：未使用品牌图标）。
   * 边界/异常：
   *  - 非目标键值的导航项不在本用例校验范围内。
   */
  test("Given dictionary action When hook builds navigation Then uses brand asset", () => {
    const { result } = renderHook(() =>
      useSidebarNavigation({ activeView: "dictionary" }),
    );

    const dictionaryAction = result.current.navigationActions.find(
      (action) => action.key === "dictionary",
    );

    expect(dictionaryAction?.icon).toBe("brand-glancy-website");
  });
});
