import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

let UserMenu: (typeof import("../UserMenu"))["default"];

beforeAll(async () => {
  jest.unstable_mockModule("@shared/components/ui/Icon", () => ({
    __esModule: true,
    default: () => null,
  }));
  jest.unstable_mockModule("@shared/components/ui/Avatar", () => ({
    __esModule: true,
    default: () => null,
  }));
  jest.unstable_mockModule("../UserMenu.module.css", () => ({
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
  jest.unstable_mockModule("../UserButton.module.css", () => ({
    __esModule: true,
    default: {
      button: "button",
      avatar: "avatar",
      meta: "meta",
      name: "name",
      plan: "plan",
    },
  }));
  ({ default: UserMenu } = await import("../UserMenu"));
});

const renderUserMenu = () => {
  render(
    <UserMenu
      displayName="测试用户"
      labels={{ settings: "设置", logout: "退出" }}
      onOpenSettings={() => {}}
      onOpenLogout={() => {}}
    />,
  );

  const trigger = screen.getByRole("button", { name: /测试用户/ });
  fireEvent.click(trigger);
  const menu = screen.getByRole("menu");
  return { trigger, menu };
};

/**
 * 测试目标：按下 Escape 键时菜单应关闭并将焦点归还触发器。
 * 前置条件：菜单已展开且触发按钮可用。
 * 步骤：
 *  1) 渲染并展开菜单。
 *  2) 在菜单上分发 Escape 键盘事件。
 * 断言：
 *  - 菜单 aria-hidden 属性变为 true（失败信息：菜单未关闭）。
 *  - 焦点回到触发按钮（失败信息：焦点未归还）。
 * 边界/异常：
 *  - 若未来支持多触发器需同步调整焦点断言。
 */
test("Given_menu_open_When_escape_pressed_Then_close_and_focus_trigger", () => {
  const { trigger, menu } = renderUserMenu();

  fireEvent.keyDown(menu, { key: "Escape" });

  expect(menu).toHaveAttribute("aria-hidden", "true");
  expect(trigger).toHaveFocus();
});

/**
 * 测试目标：验证方向键切换菜单项时焦点与激活态同步更新。
 * 前置条件：菜单已展开，存在至少两个菜单项。
 * 步骤：
 *  1) 渲染并展开菜单。
 *  2) 在菜单上分发向下方向键事件。
 *  3) 检查第二项的激活态。
 * 断言：
 *  - 第一项失去 data-active（失败信息：激活态未更新）。
 *  - 第二项获得 data-active（失败信息：未切换至下一项）。
 * 边界/异常：
 *  - 若新增禁用项需补充额外断言覆盖跳过逻辑。
 */
test("Given_menu_open_When_arrow_down_pressed_Then_move_focus_to_next_item", () => {
  const { menu } = renderUserMenu();

  const [settingsItem, logoutItem] = screen.getAllByRole("menuitem");
  expect(settingsItem).toHaveAttribute("data-active", "true");

  fireEvent.keyDown(menu, { key: "ArrowDown" });

  expect(settingsItem.getAttribute("data-active")).toBeNull();
  expect(logoutItem).toHaveAttribute("data-active", "true");
});
