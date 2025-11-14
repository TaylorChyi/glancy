import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const upgradeModalMock = jest.fn(({ open, onClose }) => (
  <button
    type="button"
    data-testid="upgrade-modal"
    data-open={open}
    onClick={onClose}
  >
    upgrade-modal
  </button>
));

const settingsModalMock = jest.fn(({ open, onClose, initialSection }) => (
  <button
    type="button"
    data-testid="settings-modal"
    data-open={open}
    data-section={initialSection}
    onClick={onClose}
  >
    settings-modal
  </button>
));

const logoutModalMock = jest.fn(({ open, onConfirm, onCancel }) => (
  <div data-testid="logout-modal" data-open={open}>
    <button type="button" onClick={onConfirm}>
      confirm
    </button>
    <button type="button" onClick={onCancel}>
      cancel
    </button>
  </div>
));

await jest.unstable_mockModule("@shared/components/modals/UpgradeModal.jsx", () => ({
  __esModule: true,
  default: upgradeModalMock,
}));

await jest.unstable_mockModule("@shared/components/modals/SettingsModal.jsx", () => ({
  __esModule: true,
  default: settingsModalMock,
}));

await jest.unstable_mockModule("@shared/components/modals/LogoutConfirmModal.jsx", () => ({
  __esModule: true,
  default: logoutModalMock,
}));

const { default: UserMenuModals } = await import("../UserMenuModals.jsx");

const setup = (props = {}, renderChildren = () => null) => {
  const clearUser = jest.fn();
  const clearHistory = jest.fn();
  const result = render(
    <UserMenuModals
      isPro={false}
      user={{ email: "user@example.com" }}
      clearUser={clearUser}
      clearHistory={clearHistory}
      {...props}
    >
      {(handlers) => renderChildren(handlers, { clearUser, clearHistory })}
    </UserMenuModals>,
  );

  return { ...result, clearUser, clearHistory };
};

const resetModalMocks = () => {
  upgradeModalMock.mockClear();
  settingsModalMock.mockClear();
  logoutModalMock.mockClear();
};

const triggerShortcutTest = async () => {
  setup();

  expect(screen.getByTestId("settings-modal")).toHaveAttribute("data-open", "false");

  await act(async () => {
    document.dispatchEvent(new Event("open-shortcuts"));
  });

  await waitFor(() =>
    expect(screen.getByTestId("settings-modal")).toHaveAttribute("data-open", "true"),
  );
  expect(screen.getByTestId("settings-modal")).toHaveAttribute("data-section", "keyboard");
};

const triggerHandlersTest = async () => {
  const { clearHistory, clearUser } = setup(
    {},
    (handlers) => (
      <>
        <button type="button" data-testid="trigger-upgrade" onClick={handlers.openUpgrade}>
          upgrade
        </button>
        <button type="button" data-testid="trigger-logout" onClick={handlers.openLogout}>
          logout
        </button>
      </>
    ),
  );

  fireEvent.click(screen.getByTestId("trigger-upgrade"));
  await waitFor(() =>
    expect(screen.getByTestId("upgrade-modal")).toHaveAttribute("data-open", "true"),
  );

  fireEvent.click(screen.getByTestId("upgrade-modal"));
  await waitFor(() =>
    expect(screen.getByTestId("upgrade-modal")).toHaveAttribute("data-open", "false"),
  );

  fireEvent.click(screen.getByTestId("trigger-logout"));
  await waitFor(() =>
    expect(screen.getByTestId("logout-modal")).toHaveAttribute("data-open", "true"),
  );

  fireEvent.click(screen.getByText("confirm"));

  expect(clearHistory).toHaveBeenCalledTimes(1);
  expect(clearUser).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(screen.getByTestId("logout-modal")).toHaveAttribute("data-open", "false"),
  );
};

describe("UserMenuModals", () => {
  beforeEach(resetModalMocks);

  describe("shortcut events", () => {
    /**
     * 测试目标：验证全局快捷键事件可打开快捷键分区。
     * 前置条件：渲染组件并监听 document 上的 open-shortcuts 事件。
     * 步骤：
     *  1) 触发 open-shortcuts 事件。
     * 断言：
     *  - SettingsModal 收到 open=true 且 initialSection 为 keyboard。
     */
    test("Given_shortcut_event_When_dispatched_Then_opens_keyboard_section", async () => {
      await triggerShortcutTest();
    });
  });

  describe("children handlers", () => {
    /**
     * 测试目标：验证儿童函数提供的 handlers 可控制升级和退出模态。
     * 前置条件：通过 children 渲染触发按钮。
     * 步骤：
     *  1) 点击升级按钮并关闭模态。
     *  2) 点击退出按钮并确认。
     * 断言：
     *  - 升级模态 open 状态切换为 true -> false。
     *  - 登出模态确认时调用 clearHistory 与 clearUser。
     */
    test("Given_handlers_When_invoked_Then_toggle_modals_and_confirm_logout", async () => {
      await triggerHandlersTest();
    });
  });
});
