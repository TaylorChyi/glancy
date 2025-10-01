import { jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react";

type ResizeObserverCallbackEntry = {
  trigger: () => void;
};

let UserMenu: (typeof import("../UserMenu"))["default"];
const mockResizeObservers: ResizeObserverCallbackEntry[] = [];

const labels = {
  help: "帮助",
  helpSection: "支持",
  settings: "设置",
  shortcuts: "快捷键",
  shortcutsDescription: "",
  upgrade: "升级",
  logout: "退出",
  accountSection: "账户",
  supportEmail: "邮件",
  report: "反馈",
};

const noop = () => {};

const createRect = ({
  top,
  bottom,
  left = 0,
  right = 0,
  width = right - left,
  height = bottom - top,
}: {
  top: number;
  bottom: number;
  left?: number;
  right?: number;
  width?: number;
  height?: number;
}) => ({
  top,
  bottom,
  left,
  right,
  width,
  height,
  x: left,
  y: top,
  toJSON: () => ({}),
});

beforeAll(async () => {
  jest.unstable_mockModule("@/components/ui/Icon", () => ({
    __esModule: true,
    default: () => null,
  }));
  jest.unstable_mockModule("@/components/ui/Avatar", () => ({
    __esModule: true,
    default: () => null,
  }));
  ({ default: UserMenu } = await import("../UserMenu"));
});

beforeEach(() => {
  jest.useFakeTimers();
  mockResizeObservers.length = 0;
  class MockResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      mockResizeObservers.push({
        trigger: () => {
          this.callback([], this);
        },
      });
    }

    observe() {}

    unobserve() {}

    disconnect() {}
  }

  // @ts-expect-error override in test environment
  global.ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  // @ts-expect-error cleanup mock
  delete global.ResizeObserver;
});

const openUserMenu = () => {
  const { container } = render(
    <UserMenu
      displayName="测试用户"
      labels={labels}
      isPro={false}
      onOpenSettings={noop}
      onOpenShortcuts={noop}
      onOpenUpgrade={noop}
      onOpenLogout={noop}
    />,
  );

  const root = container.firstChild as HTMLElement;
  Object.defineProperty(root, "getBoundingClientRect", {
    value: () => createRect({ top: 0, bottom: 600, right: 320, left: 0 }),
  });

  const trigger = screen.getByRole("button", { name: /测试用户/ });
  fireEvent.click(trigger);

  return { container };
};

const hoverHelpItem = (container: HTMLElement) => {
  const helpItem = screen.getByRole("menuitem", { name: /帮助/ });
  Object.defineProperty(helpItem, "getBoundingClientRect", {
    value: () => createRect({ top: 180, bottom: 240, right: 280, left: 0 }),
  });
  fireEvent.mouseEnter(helpItem);
  act(() => {
    jest.advanceTimersByTime(40);
  });

  const menus = Array.from(
    container.querySelectorAll('[role="menu"]'),
  ) as HTMLElement[];
  const submenu = menus[menus.length - 1];
  Object.defineProperty(submenu, "offsetHeight", {
    configurable: true,
    value: 200,
  });
  act(() => {
    mockResizeObservers.forEach((observer) => observer.trigger());
  });
  return { helpItem, submenu };
};

/**
 * 测试目标：鼠标悬浮帮助项后子菜单应立即打开并保持底边对齐。
 * 前置条件：用户菜单已展开且父节点位置信息已被模拟。
 * 步骤：
 *  1) 展开用户菜单。
 *  2) 悬浮帮助项并推进计时器。
 *  3) 触发子菜单高度回调。
 * 断言：
 *  - 子菜单 data-open 属性为 true。
 *  - 子菜单 top 样式等于父节点底边减子菜单高度。
 * 边界/异常：
 *  - 若高度更新迟缓，ResizeObserver 回调需保证最终位置正确。
 */
test("Given_HelpHovered_WhenDelayElapsed_ThenSubmenuOpensBottomAligned", () => {
  const { container } = openUserMenu();
  const { submenu } = hoverHelpItem(container);

  expect(submenu.getAttribute("data-open")).toBe("true");
  expect(submenu.style.top).toBe("40px");
});

/**
 * 测试目标：快速从帮助项移动到子菜单时不得触发关闭。
 * 前置条件：子菜单已因悬浮打开。
 * 步骤：
 *  1) 悬浮帮助项并等待打开。
 *  2) 立即离开帮助项并进入子菜单。
 *  3) 推进关闭计时器。
 * 断言：
 *  - 子菜单仍处于打开状态。
 * 边界/异常：
 *  - 若未正确取消关闭计时器，此断言会失败。
 */
test("Given_SubmenuOpen_WhenPointerTransfersQuickly_ThenKeepVisible", () => {
  const { container } = openUserMenu();
  const { helpItem, submenu } = hoverHelpItem(container);

  fireEvent.mouseLeave(helpItem);
  fireEvent.mouseEnter(submenu);

  act(() => {
    jest.advanceTimersByTime(100);
  });

  expect(submenu.getAttribute("data-open")).toBe("true");
});
