import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockUserMenu = jest.fn();

await jest.unstable_mockModule("../UserMenu", () => ({
  __esModule: true,
  default: (props) => {
    mockUserMenu(props);
    return null;
  },
}));

await jest.unstable_mockModule("../UserDock.module.css", () => ({
  __esModule: true,
  default: {
    wrapper: "wrapper",
  },
}));

const { default: AuthenticatedDock } = await import(
  "../user/AuthenticatedDock.jsx"
);

describe("AuthenticatedDock", () => {
  beforeEach(() => {
    mockUserMenu.mockClear();
  });

  /**
   * 测试目标：验证所有 props 会转发至 UserMenu。
   * 前置条件：提供包含完整回调与标签的 props。
   * 步骤：
   *  1) 渲染组件。
   *  2) 检查 mock 的 UserMenu 入参。
   * 断言：
   *  - displayName、planLabel、labels 与三个回调均保持引用（失败信息：UserMenu props 转发错误）。
   * 边界/异常：
   *  - planLabel 可选，默认空字符串，本用例覆盖自定义值。
   */
  test("Given_props_When_rendered_Then_forwards_to_user_menu", () => {
    const labels = {
      help: "帮助",
      settings: "设置",
      logout: "退出",
    };
    const props = {
      displayName: "Alice",
      planLabel: "Plus",
      labels,
      onOpenSettings: jest.fn(),
      onOpenLogout: jest.fn(),
    };

    render(<AuthenticatedDock {...props} />);

    expect(screen.getByTestId("sidebar-user-dock")).toHaveClass("wrapper");
    expect(mockUserMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: props.displayName,
        planLabel: props.planLabel,
        labels: props.labels,
        onOpenSettings: props.onOpenSettings,
        onOpenLogout: props.onOpenLogout,
      }),
    );
  });
});
