/* eslint-env jest */
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

const mockLanguage = {
  prefTitle: "Account preferences",
  prefDescription: "Review and curate your Glancy identity.",
  prefAccountTitle: "Account",
  prefTablistLabel: "Preference sections",
  settingsAccountDescription: "Details that travel with your workspace.",
  settingsAccountAvatarLabel: "Change avatar",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountTitle: "Account",
  settingsTabAccount: "Account",
  settingsTabData: "Data controls",
  settingsTabGeneral: "General",
  settingsEmptyValue: "Not set",
  settingsManageProfile: "Manage profile",
  changeAvatar: "Change avatar",
  settingsAccountBindingTitle: "Connected accounts",
  settingsAccountBindingApple: "Apple",
  settingsAccountBindingGoogle: "Google",
  settingsAccountBindingWeChat: "WeChat",
  settingsAccountBindingStatusUnlinked: "Not linked",
  settingsAccountBindingActionPlaceholder: "Coming soon",
  settingsAccountEmailUnbindAction: "Unlink email",
  settingsAccountPhoneRebindAction: "Change phone",
  settingsAccountUsernameSaveAction: "Save username",
  settingsAccountUsernameRequired: "Username required",
  settingsAccountUsernameInvalid: "Invalid username",
  settingsAccountUsernameConflict: "Username exists",
  settingsAccountUsernameUpdateError: "Save failed",
  usernamePlaceholder: "Enter username",
};

let mockUser;

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({ t: mockLanguage }),
  useUser: () => ({ user: mockUser }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
  useKeyboardShortcutContext: () => ({
    shortcuts: [],
    updateShortcut: jest.fn().mockResolvedValue(undefined),
    resetShortcuts: jest.fn().mockResolvedValue(undefined),
    pendingAction: null,
    errors: {},
    status: "idle",
  }),
  KEYBOARD_SHORTCUT_RESET_ACTION: "reset",
}));

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: () => ({
    users: {
      updateUsername: jest.fn().mockResolvedValue({ username: "Ada" }),
    },
  }),
}));

jest.unstable_mockModule("@/components/ui/Avatar", () => ({
  __esModule: true,
  default: ({ className }) => (
    <div data-testid="avatar" className={className}>
      avatar
    </div>
  ),
}));

const { default: Preferences } = await import("@/pages/preferences");

beforeEach(() => {
  mockUser = {
    username: "Ada",
    email: "ada@example.com",
    phone: "+1-111",
    plan: "plus",
    token: "token-123",
  };
});

/**
 * 测试目标：切换到账户标签后展示账户字段。
 * 前置条件：
 *  - 已 mock useUser 返回完整账户信息；
 *  - 已 mock 语言包提供账户分区文案。
 * 步骤：
 *  1) 渲染 Preferences 页面；
 *  2) 通过标签切换到账户分区；
 *  3) 查询面板内的字段标签和值。
 * 断言：
 *  - 用户名、邮箱、手机号标签与值存在；
 *  - 当前激活面板为账户分区。
 * 边界/异常：
 *  - 若用户信息缺失，应在另一个用例中验证占位符（见下方测试）。
 */
test("GivenUserContext_WhenSwitchingToAccountTab_ThenAccountFieldsVisible", async () => {
  render(<Preferences />);

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const activePanel = screen.getByRole("tabpanel");
  expect(
    within(activePanel).getByText(mockLanguage.settingsAccountUsername),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getAllByText(mockLanguage.settingsAccountAvatarLabel),
  ).toHaveLength(2);
  expect(within(activePanel).getAllByText(mockUser.username)).toHaveLength(2);
  expect(within(activePanel).getByText(mockUser.email)).toBeInTheDocument();
  expect(within(activePanel).getByText("+1 111")).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", { name: mockLanguage.changeAvatar }),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", { name: mockLanguage.settingsManageProfile }),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", { name: mockLanguage.settingsAccountEmailUnbindAction }),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", { name: mockLanguage.settingsAccountPhoneRebindAction }),
  ).toBeInTheDocument();
  expect(within(activePanel).getByTestId("avatar")).toBeInTheDocument();
  expect(
    within(activePanel).getByText(mockLanguage.settingsAccountBindingTitle),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getAllByText(
      mockLanguage.settingsAccountBindingStatusUnlinked,
    ),
  ).toHaveLength(3);
  const bindingActions = within(activePanel).getAllByRole("button", {
    name: mockLanguage.settingsAccountBindingActionPlaceholder,
  });
  expect(bindingActions).toHaveLength(3);
  bindingActions.forEach((action) => {
    expect(action).toBeDisabled();
  });
});

/**
 * 测试目标：账户字段缺失时使用占位文案。
 * 前置条件：
 *  - mockUser 仅包含用户名与 token，邮箱与手机号为空。
 * 步骤：
 *  1) 渲染 Preferences 页面；
 *  2) 切换到账户分区；
 *  3) 统计占位文案出现次数。
 * 断言：
 *  - 占位文案数量等于缺失字段数量（2）。
 * 边界/异常：
 *  - 若翻译缺失，Fallback 文案 `settingsEmptyValue` 应仍生效。
 */
test("GivenMissingAccountData_WhenSwitchingToAccountTab_ThenFallbackShown", async () => {
  mockUser = {
    username: "Ada",
    email: "",
    phone: undefined,
    plan: "",
    token: "token-123",
  };

  render(<Preferences />);

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const fallback = mockLanguage.settingsEmptyValue;
  const activePanel = screen.getByRole("tabpanel");
  expect(within(activePanel).getAllByText(fallback)).toHaveLength(2);
});
