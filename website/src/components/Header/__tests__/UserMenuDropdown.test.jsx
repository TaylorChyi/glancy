/**
 * 背景：
 *  - Header 用户菜单在触控设备上通过鼠标事件无法触发帮助子菜单，导致交互不一致。
 * 目的：
 *  - 通过单测覆盖 Pointer 悬浮展开与离开收起的关键路径，防止回归。
 * 关键决策与取舍：
 *  - 引入 expectAttribute 辅助函数提供语义化断言信息，优先语义胜于简单 expect。
 * 影响范围：
 *  - Header/UserMenuDropdown 组件的帮助子菜单交互。
 * 演进与TODO：
 *  - TODO：补充键盘导航与辅助技术相关的交互测试。
 */
import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import UserMenuDropdown from "../UserMenuDropdown";
import styles from "../Header.module.css";

const expectAttribute = (element, attribute, expected, message) => {
  const actual = element.getAttribute(attribute);
  if (actual !== expected) {
    throw new Error(
      `${message}（期望：${expected}，实际：${actual ?? "null"}）`,
    );
  }
};

const baseTranslations = {
  upgrade: "升级",
  settings: "设置",
  help: "帮助",
  logout: "退出",
  helpCenter: "帮助中心",
  releaseNotes: "更新日志",
  termsPolicies: "条款与政策",
  reportBug: "报告问题",
  downloadApps: "客户端下载",
};

const renderDropdown = (overrideProps = {}) => {
  const props = {
    open: true,
    setOpen: jest.fn(),
    t: baseTranslations,
    isPro: false,
    onOpenSettings: jest.fn(),
    onOpenUpgrade: jest.fn(),
    onOpenLogout: jest.fn(),
    ...overrideProps,
  };
  return render(<UserMenuDropdown {...props} />);
};

describe("UserMenuDropdown", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 测试目标：Pointer 悬浮帮助按钮时应立即展开帮助子菜单。
   * 前置条件：渲染展开状态的菜单，帮助子菜单初始关闭。
   * 步骤：
   *  1) 渲染组件并定位帮助按钮与子菜单容器。
   *  2) 对帮助按钮触发 pointerEnter 事件。
   * 断言：
   *  - 子菜单 data-open 属性应为 "true"（失败信息：悬浮后子菜单未打开）。
   * 边界/异常：
   *  - 子菜单 aria-hidden 属性应同步为 "false"，确保可访问性状态正确。
   */
  test("Given_HelpHovered_WhenPointerEnter_ThenSubmenuOpens", () => {
    const { container } = renderDropdown();
    const helpButton = screen.getByRole("menuitem", { name: /帮助/ });
    const submenu = container.querySelector(`.${styles["submenu-panel"]}`);

    if (!(submenu instanceof HTMLElement)) {
      throw new Error("未找到帮助子菜单容器");
    }

    expectAttribute(submenu, "data-open", "false", "初始状态子菜单应关闭");

    fireEvent.pointerEnter(helpButton);

    expectAttribute(submenu, "data-open", "true", "悬浮后子菜单未打开");
    expectAttribute(
      submenu,
      "aria-hidden",
      "false",
      "子菜单可访问性状态未同步",
    );
  });

  /**
   * 测试目标：在帮助项悬浮展开后，离开整个菜单区域应关闭子菜单。
   * 前置条件：渲染展开状态的菜单并通过悬浮打开子菜单。
   * 步骤：
   *  1) 渲染组件并触发帮助按钮 pointerEnter。
   *  2) 对根节点触发 pointerLeave 事件模拟离开菜单区域。
   * 断言：
   *  - 子菜单 data-open 属性恢复为 "false"（失败信息：离开菜单后子菜单仍保持打开）。
   * 边界/异常：
   *  - 子菜单 aria-hidden 属性同步为 "true"，确保对辅助技术友好。
   */
  test("Given_MenuPointerLeave_WhenPointerLeave_ThenSubmenuCloses", () => {
    const { container } = renderDropdown();
    const helpButton = screen.getByRole("menuitem", { name: /帮助/ });
    const root = container.firstChild;
    const submenu = container.querySelector(`.${styles["submenu-panel"]}`);

    if (!(root instanceof HTMLElement)) {
      throw new Error("菜单根节点缺失");
    }
    if (!(submenu instanceof HTMLElement)) {
      throw new Error("未找到帮助子菜单容器");
    }

    fireEvent.pointerEnter(helpButton);
    expectAttribute(submenu, "data-open", "true", "子菜单应当在悬浮后打开");

    fireEvent.pointerLeave(root);

    expectAttribute(
      submenu,
      "data-open",
      "false",
      "离开菜单后子菜单仍保持打开",
    );
    expectAttribute(submenu, "aria-hidden", "true", "子菜单可访问性状态未关闭");
  });
});
