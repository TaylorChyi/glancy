import { forwardRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

await jest.unstable_mockModule("../UserMenu.module.css", () => ({
  __esModule: true,
  default: {
    root: "root",
    surface: "surface",
    list: "list",
    "menu-item": "menu-item",
    icon: "icon",
    labels: "labels",
    "primary-label": "primary-label",
    "secondary-label": "secondary-label",
    "meta-label": "meta-label",
  },
}));

await jest.unstable_mockModule("../UserButton.module.css", () => ({
  __esModule: true,
  default: {
    button: "button",
  },
}));

await jest.unstable_mockModule("@shared/components/ui/Icon", () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`} />, // icon rendering not under test
}));

await jest.unstable_mockModule("../UserButton", () => ({
  __esModule: true,
  default: forwardRef(({ displayName, onToggle, open }, ref) => (
    <button
      type="button"
      ref={ref}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
    >
      {displayName}
    </button>
  )),
}));

const { default: UserMenu } = await import("../UserMenu.tsx");

describe("Sidebar/UserMenu", () => {
  const baseLabels = {
    settings: "设置",
    logout: "退出",
  };

  const renderMenu = (overrides = {}) => {
    const props = {
      displayName: "Alice",
      planLabel: "Plus",
      labels: baseLabels,
      onOpenSettings: jest.fn(),
      onOpenLogout: jest.fn(),
      ...overrides,
    };

    render(<UserMenu {...props} />);
    return props;
  };

  const openMenu = () => {
    const trigger = screen.getByRole("button", { name: "Alice" });
    fireEvent.click(trigger);
  };

  /**
   * 测试目标：验证菜单仅渲染核心操作项且不再包含帮助入口。
   * 前置条件：渲染登录态菜单并展开。
   * 步骤：
   *  1) 点击触发按钮展开菜单。
   *  2) 查询所有菜单项文本。
   * 断言：
   *  - 仅包含“设置”“退出”两项（失败信息：用户菜单仍包含已下线入口）。
   * 边界/异常：
   *  - 若未来新增菜单项需同步更新断言集合。
   */
  test("Given_menu_open_When_rendered_Then_contains_only_core_actions", () => {
    renderMenu();
    openMenu();

    const items = screen.getAllByRole("menuitem");
    const labels = items.map((item) => item.textContent?.trim());

    expect(labels).toEqual(["设置", "退出"]);
    expect(screen.queryByRole("menuitem", { name: /帮助/ })).toBeNull();
  });

  /**
   * 测试目标：验证点击菜单项时触发对应回调并关闭菜单。
   * 前置条件：渲染菜单并注入 mock 回调。
   * 步骤：
   *  1) 展开菜单。
   *  2) 依次点击“设置”“退出”项。
   * 断言：
   *  - onOpenSettings 收到参数 "general"（失败信息：设置入口未触发默认分区）。
   *  - onOpenLogout 被调用一次（失败信息：退出入口未触发回调）。
   * 边界/异常：
   *  - 若菜单已关闭需先重新展开，本用例在正常流程内验证。
   */
  test("Given_action_clicked_When_interacted_Then_invokes_callbacks_and_closes", () => {
    const props = renderMenu();
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "设置" }));
    expect(props.onOpenSettings).toHaveBeenCalledWith("general");
    expect(screen.queryByRole("menuitem", { name: "退出" })).toBeNull();

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "退出" }));
    expect(props.onOpenLogout).toHaveBeenCalledTimes(1);
  });
});
