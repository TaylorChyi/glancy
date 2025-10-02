import { forwardRef } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    "submenu-indicator": "submenu-indicator",
    submenu: "submenu",
    "submenu-list": "submenu-list",
    "submenu-item": "submenu-item",
    "submenu-item-icon": "submenu-item-icon",
  },
}));

await jest.unstable_mockModule("../UserButton.module.css", () => ({
  __esModule: true,
  default: {
    button: "button",
  },
}));

await jest.unstable_mockModule("@/components/ui/Icon", () => ({
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
    help: "帮助",
    settings: "设置",
    shortcuts: "快捷键",
    shortcutsDescription: "快捷键说明",
    logout: "退出",
    helpCenter: "帮助中心",
    releaseNotes: "版本说明",
    termsPolicies: "条款与政策",
    reportBug: "问题反馈",
    downloadApps: "下载应用",
  };

  const renderMenu = (overrides = {}) => {
    const props = {
      displayName: "Alice",
      planLabel: "Plus",
      labels: baseLabels,
      onOpenSettings: jest.fn(),
      onOpenShortcuts: jest.fn(),
      onOpenLogout: jest.fn(),
      ...overrides,
    };

    render(<UserMenu {...props} />);
    return props;
  };

  const openHelpSubmenu = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    const helpTrigger = await screen.findByRole("menuitem", { name: /帮助/ });
    fireEvent.focus(helpTrigger);
    fireEvent.mouseEnter(helpTrigger);
    let menus = [];
    await waitFor(() => {
      menus = screen.getAllByRole("menu");
      if (menus.length < 2) {
        throw new Error("submenu not open");
      }
    });
    menus = screen.getAllByRole("menu");
    return menus[menus.length - 1];
  };

  /**
   * 测试目标：验证快捷方式之外的帮助子项触发自定义事件协议。
   * 前置条件：渲染登录态菜单并展开帮助子菜单。
   * 步骤：
   *  1) 打开主菜单与帮助子菜单。
   *  2) 点击“帮助中心”子项。
   * 断言：
   *  - window.dispatchEvent 收到 glancy-help 事件，且 action 为 center（失败信息：帮助中心事件未按协议触发）。
   * 边界/异常：
   *  - 若子菜单未展开将无法找到元素，本用例聚焦于正常路径。
   */
  test("Given_help_center_item_When_selected_Then_dispatches_help_event", async () => {
    const props = renderMenu();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    try {
      const submenu = await openHelpSubmenu();
      const helpCenterItem = await within(submenu).findByRole("menuitem", {
        name: /帮助中心/,
      });

      dispatchSpy.mockClear();
      fireEvent.click(helpCenterItem);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.type).toBe("glancy-help");
      expect(event.detail).toEqual({ action: "center" });
      expect(props.onOpenShortcuts).not.toHaveBeenCalled();
    } finally {
      dispatchSpy.mockRestore();
    }
  });

  /**
   * 测试目标：验证快捷键子项继续走 onOpenShortcuts 回调而非派发事件。
   * 前置条件：渲染登录态菜单并展开帮助子菜单。
   * 步骤：
   *  1) 打开主菜单与帮助子菜单。
   *  2) 点击“快捷键”子项。
   * 断言：
   *  - onOpenShortcuts 被调用一次，window.dispatchEvent 未新增 glancy-help 事件（失败信息：快捷键项事件协议错误）。
   * 边界/异常：
   *  - 若菜单提前关闭则需重新展开，本用例聚焦一次操作。
   */
  test("Given_shortcuts_item_When_selected_Then_invokes_shortcuts_callback_only", async () => {
    const onOpenShortcuts = jest.fn();
    renderMenu({ onOpenShortcuts });
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    try {
      const submenu = await openHelpSubmenu();
      const shortcutsItem = await within(submenu).findByRole("menuitem", {
        name: /快捷键/,
      });

      dispatchSpy.mockClear();
      fireEvent.click(shortcutsItem);

      expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).not.toHaveBeenCalled();
    } finally {
      dispatchSpy.mockRestore();
    }
  });
});
