import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import UserMenuDropdown from "../UserMenuDropdown";

const expectElementPresent = (element, message) => {
  if (!element) {
    throw new Error(message);
  }
};

const expectElementAbsent = (element, message) => {
  if (element) {
    throw new Error(message);
  }
};

const baseTranslations = {
  upgrade: "升级",
  settings: "设置",
  logout: "退出",
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
   * 测试目标：非 Pro 用户应看到“升级”“设置”“退出”三个操作。
   * 前置条件：渲染 open 状态的菜单，传入非 Pro 用户标志。
   * 步骤：
   *  1) 渲染组件并查找升级、设置、退出按钮。
   * 断言：
   *  - 三个按钮均存在且语义化名称正确（失败信息指示缺失按钮）。
   * 边界/异常：
   *  - 升级按钮仅在非 Pro 状态下出现，避免误导已有会员。
   */
  test("Given_NonProUser_WhenRendered_ThenShowsCoreActions", () => {
    renderDropdown({ isPro: false });

    expectElementPresent(
      screen.queryByRole("menuitem", { name: /升级/ }),
      "非 Pro 用户应看到升级入口",
    );
    expectElementPresent(
      screen.queryByRole("menuitem", { name: /设置/ }),
      "应渲染账户设置入口",
    );
    expectElementPresent(
      screen.queryByRole("menuitem", { name: /退出/ }),
      "应渲染退出登录入口",
    );
  });

  /**
   * 测试目标：Pro 用户不应看到升级入口。
   * 前置条件：渲染 open 状态的菜单，并传入 isPro=true。
   * 步骤：
   *  1) 渲染组件后尝试查找“升级”按钮。
   * 断言：
   *  - 查询应失败，说明按钮未渲染（失败信息：Pro 用户仍出现升级）。
   * 边界/异常：
   *  - 同时校验设置与退出仍可用。
   */
  test("Given_ProUser_WhenRendered_ThenHidesUpgradeEntry", () => {
    renderDropdown({ isPro: true });

    expectElementAbsent(
      screen.queryByRole("menuitem", { name: /升级/ }),
      "Pro 用户不应看到升级入口",
    );
    expectElementPresent(
      screen.queryByRole("menuitem", { name: /设置/ }),
      "Pro 用户仍需访问设置",
    );
    expectElementPresent(
      screen.queryByRole("menuitem", { name: /退出/ }),
      "Pro 用户仍需退出登录",
    );
  });

  /**
   * 测试目标：点击任一菜单项应触发对应回调并关闭菜单。
   * 前置条件：渲染 open 状态的菜单并注入自定义 setOpen。
   * 步骤：
   *  1) 渲染组件并点击“设置”按钮。
   *  2) 观察回调与 setOpen 调用。
   * 断言：
   *  - onOpenSettings 被触发，setOpen(false) 被调用（失败信息：菜单未执行回调或未关闭）。
   * 边界/异常：
   *  - setOpen 应仅被调用一次且参数为 false，避免重复关闭。
   */
  test("Given_MenuAction_WhenClick_ThenInvokesHandlerAndClosesMenu", () => {
    const onOpenSettings = jest.fn();
    const setOpen = jest.fn();

    renderDropdown({ onOpenSettings, setOpen });

    fireEvent.click(screen.getByRole("menuitem", { name: /设置/ }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
