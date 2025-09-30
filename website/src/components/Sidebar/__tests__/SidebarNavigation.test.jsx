import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

jest.mock("@/components/ui/Icon", () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

import SidebarNavigation from "../actions/SidebarNavigation.jsx";

const createActions = () => [
  {
    key: "dictionary",
    icon: "glancy-web",
    label: "Dictionary",
    active: true,
    onClick: jest.fn(),
    testId: "sidebar-nav-dictionary",
  },
  {
    key: "favorites",
    icon: "library",
    label: "Favorites",
    active: false,
    onClick: jest.fn(),
    testId: "sidebar-nav-favorites",
  },
];

describe("SidebarNavigation", () => {

  /**
   * 测试目标：验证导航按钮点击时会触发对应回调。
   * 前置条件：提供包含 onClick mock 的动作数组，并渲染组件。
   * 步骤：
   *  1) 渲染 SidebarNavigation。
   *  2) 触发第二个按钮的点击事件。
   * 断言：
   *  - 对应 onClick mock 被调用一次（失败信息：未触发收藏按钮回调）。
   * 边界/异常：
   *  - 若动作数组为空则无按钮，本用例不覆盖该边界。
   */
  test("Given actions When click favorite Then invokes handler", () => {
    const actions = createActions();
    render(<SidebarNavigation actions={actions} ariaLabel="Navigation" />);

    fireEvent.click(screen.getByTestId("sidebar-nav-favorites"));

    expect(actions[1].onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：验证 active 状态会映射到按钮属性。
   * 前置条件：提供带 active 标记的动作数组。
   * 步骤：
   *  1) 渲染 SidebarNavigation。
   *  2) 获取标记为 active 的按钮。
   * 断言：
   *  - 按钮 data-active 为 "true"，aria-pressed 为 "true"（失败信息：激活态映射失败）。
   * 边界/异常：
   *  - 若按钮未提供 active，则默认 false，不在本用例覆盖范围。
   */
  test("Given active action When rendered Then exposes pressed state", () => {
    const actions = createActions();
    render(<SidebarNavigation actions={actions} ariaLabel="Navigation" />);

    const activeButton = screen.getByTestId("sidebar-nav-dictionary");
    expect(activeButton.getAttribute("data-active")).toBe("true");
    expect(activeButton).toHaveAttribute("aria-pressed", "true");
  });
});
