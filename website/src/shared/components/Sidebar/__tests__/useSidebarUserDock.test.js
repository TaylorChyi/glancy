import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

let userState = { user: null, clearUser: jest.fn() };
let historyState = { clearHistory: jest.fn() };
let languageState = { t: {} };

jest.unstable_mockModule("@core/context", () => ({
  useUser: () => userState,
  useHistory: () => historyState,
  useLanguage: () => languageState,
}));

const { default: useSidebarUserDock } = await import(
  "../hooks/useSidebarUserDock.js"
);

describe("useSidebarUserDock", () => {
  beforeEach(() => {
    userState = { user: null, clearUser: jest.fn() };
    historyState = { clearHistory: jest.fn() };
    languageState = {
      t: {
        navLogin: "登录",
        navRegister: "注册",
        settings: "设置",
        logout: "退出",
      },
    };
  });

  /**
   * 测试目标：验证匿名用户时导航按钮标签正确派生。
   * 前置条件：useUser 返回 null，语言包提供登录/注册文案。
   * 步骤：
   *  1) 渲染 Hook。
   *  2) 读取 anonymousNav。
   * 断言：
   *  - 登录与注册按钮的 label 与路由符合期望（失败信息：匿名导航文案映射错误）。
   * 边界/异常：
   *  - 若语言包缺失文案，将回退默认值，本用例未覆盖该分支。
   */
  test("Given_anonymous_user_When_hook_runs_Then_exposes_login_navigation", () => {
    const { result } = renderHook(() => useSidebarUserDock());

    expect(result.current.hasUser).toBe(false);
    expect(result.current.anonymousNav.login).toEqual({
      icon: "arrow-right-on-rectangle",
      label: "登录",
      to: "/login",
    });
    expect(result.current.anonymousNav.register).toEqual({
      icon: "user",
      label: "注册",
      to: "/register",
    });
  });

  /**
   * 测试目标：验证登录用户的派生状态与模态回调映射。
   * 前置条件：useUser 返回 pro 用户，语言包覆盖必要文案。
   * 步骤：
   *  1) 渲染 Hook。
   *  2) 调用 buildAuthenticatedProps 映射模态控制。
   * 断言：
   *  - planLabel 正确派生且 labels 不包含升级文案（失败信息：会员状态派生错误）。
   *  - 回调被正确转发（失败信息：模态控制映射错误）。
   * 边界/异常：
   *  - 当缺少用户名时将回退邮箱，本用例未触达。
   */
  test("Given_pro_user_When_build_props_Then_maps_modal_controls", () => {
    const openSettings = jest.fn();
    const openLogout = jest.fn();

    userState = {
      user: { username: "alice", plan: "plus", member: true },
      clearUser: jest.fn(),
    };
    historyState = { clearHistory: jest.fn() };
    languageState = {
      t: {
        settings: "设置",
        logout: "退出",
      },
    };

    const { result } = renderHook(() => useSidebarUserDock());

    expect(result.current.modalProps).toMatchObject({
      isPro: true,
      user: userState.user,
    });

    const props = result.current.buildAuthenticatedProps({
      openSettings,
      openLogout,
    });

    expect(props.displayName).toBe("alice");
    expect(props.planLabel).toBe("Plus");
    expect(props.labels).not.toHaveProperty("upgrade");
    expect(props).not.toHaveProperty("onOpenUpgrade");
    expect(props.labels).toEqual({
      settings: "设置",
      logout: "退出",
    });
    expect(props.onOpenSettings).toBe(openSettings);
    expect(props.onOpenLogout).toBe(openLogout);
  });

  /**
   * 测试目标：验证免费用户派生标签集合保持精简且包含必要 fallback。
   * 前置条件：useUser 返回 plan 为 free 的用户。
   * 步骤：
   *  1) 渲染 Hook 并构建 props。
   * 断言：
   *  - planLabel 为 "Free" 且 labels 仅包含菜单所需键（失败信息：免费用户标签派生错误）。
   * 边界/异常：
   *  - 若 plan 缺失则回退为 "Free"，此处覆盖显式 free。
   */
  test("Given_free_user_When_build_props_Then_returns_minimal_labels", () => {
    userState = {
      user: { email: "user@example.com", plan: "free" },
      clearUser: jest.fn(),
    };
    historyState = { clearHistory: jest.fn() };
    languageState = {
      t: {
        settings: "设置",
        logout: "退出",
      },
    };

    const { result } = renderHook(() => useSidebarUserDock());

    const props = result.current.buildAuthenticatedProps({
      openSettings: jest.fn(),
      openLogout: jest.fn(),
    });

    expect(props.planLabel).toBe("Free");
    expect(props.labels).toEqual({
      settings: "设置",
      logout: "退出",
    });
  });
});
