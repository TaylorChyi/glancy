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
  settingsAccountAvatarLabel: "Avatar",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountTitle: "Account",
  settingsTabAccount: "Account",
  settingsTabData: "Data controls",
  settingsTabGeneral: "General",
  settingsEmptyValue: "Not set",
  changeAvatar: "Change avatar",
  settingsAccountBindingTitle: "Connected accounts",
  settingsAccountBindingApple: "Apple",
  settingsAccountBindingGoogle: "Google",
  settingsAccountBindingWeChat: "WeChat",
  settingsAccountBindingStatusUnlinked: "Not linked",
  settingsAccountBindingActionPlaceholder: "Coming soon",
  settingsAccountEmailUnbindAction: "Unlink email",
  settingsAccountEmailUnbinding: "Removing…",
  settingsAccountPhoneRebindAction: "Change phone",
  usernamePlaceholder: "Enter username",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  saving: "Saving...",
  usernameValidationEmpty: "Username cannot be empty",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateFailed: "Unable to update username",
};

let mockUser;
let mockSetUser;
let updateUsernameMock;
const mockUseAvatarEditorWorkflow = jest.fn();
const mockUseEmailBinding = jest.fn();
let unbindEmailMock;

beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
});

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({ t: mockLanguage }),
  useUser: () => ({ user: mockUser, setUser: mockSetUser }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
  useKeyboardShortcutContext: () => ({
    register: jest.fn(),
    unregister: jest.fn(),
  }),
  KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
}));

jest.unstable_mockModule("@/api/users.js", () => ({
  useUsersApi: () => ({
    updateUsername: updateUsernameMock,
    unbindEmail: jest.fn(),
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

jest.unstable_mockModule("@/hooks/useAvatarEditorWorkflow.js", () => ({
  __esModule: true,
  default: mockUseAvatarEditorWorkflow,
}));

jest.unstable_mockModule("@/hooks/useEmailBinding.js", () => ({
  __esModule: true,
  default: mockUseEmailBinding,
  useEmailBinding: mockUseEmailBinding,
}));

const { default: Preferences } = await import("@/pages/preferences");

beforeEach(() => {
  updateUsernameMock = jest.fn().mockResolvedValue({ username: "ada" });
  mockSetUser = jest.fn();
  mockUser = {
    id: "user-1",
    username: "Ada",
    email: "ada@example.com",
    phone: "+1-111",
    plan: "plus",
    token: "token-123",
  };
  mockUseAvatarEditorWorkflow.mockReset();
  mockUseAvatarEditorWorkflow.mockReturnValue({
    selectAvatar: jest.fn(),
    modalProps: {
      open: false,
      source: "",
      onCancel: jest.fn(),
      onConfirm: jest.fn(),
      labels: {},
      isProcessing: false,
    },
    isBusy: false,
  });
  unbindEmailMock = jest.fn().mockResolvedValue({ email: null });
  mockUseEmailBinding.mockReset();
  mockUseEmailBinding.mockReturnValue({
    mode: "idle",
    startEditing: jest.fn(),
    cancelEditing: jest.fn(),
    requestCode: jest.fn(),
    confirmChange: jest.fn(),
    unbindEmail: unbindEmailMock,
    isSendingCode: false,
    isVerifying: false,
    isUnbinding: false,
    codeIssuedAt: null,
    lastRequestedEmail: null,
    requestedEmail: null,
    hasBoundEmail: true,
  });
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
  ).toHaveLength(1);
  expect(
    within(activePanel).getByDisplayValue(mockUser.username),
  ).toBeInTheDocument();
  expect(within(activePanel).getByText(mockUser.email)).toBeInTheDocument();
  expect(within(activePanel).getByText("+1 111")).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", {
      name: mockLanguage.changeAvatar,
    }),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", {
      name: mockLanguage.changeUsernameButton,
    }),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", {
      name: mockLanguage.settingsAccountEmailUnbindAction,
    }),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByRole("button", {
      name: mockLanguage.settingsAccountPhoneRebindAction,
    }),
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
 * 测试目标：在偏好设置页面点击“解绑邮箱”应触发 emailBinding.unbindEmail。
 * 前置条件：mockUseEmailBinding 返回带 unbindEmail 的命令；用户拥有邮箱。
 * 步骤：
 *  1) 渲染 Preferences 并切换到账户分区；
 *  2) 点击解绑邮箱按钮。
 * 断言：
 *  - unbindEmail 被调用一次；
 * 边界/异常：
 *  - 若按钮禁用或未触发事件则测试失败。
 */
test("GivenBoundEmail_WhenClickingUnbind_ThenInvokeEmailBindingCommand", async () => {
  const user = userEvent.setup();

  render(<Preferences />);

  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const unbindButton = within(screen.getByRole("tabpanel")).getByRole(
    "button",
    {
      name: mockLanguage.settingsAccountEmailUnbindAction,
    },
  );

  await user.click(unbindButton);

  expect(unbindEmailMock).toHaveBeenCalledTimes(1);
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
    id: "user-1",
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

/**
 * 测试目标：点击更换用户名后输入框可编辑并成功保存调用 API。
 * 前置条件：mockUser 包含 id/token，updateUsernameMock 成功解析用户名。
 * 步骤：
 *  1) 渲染页面并切换到账户分区；
 *  2) 点击更换用户名按钮进入编辑态；
 *  3) 修改用户名并保存；
 * 断言：
 *  - updateUsernameMock 收到规范化后的用户名；
 *  - setUser 被调用并带有新用户名；
 *  - 按钮文案恢复为更换用户名且输入禁用。
 * 边界/异常：
 *  - 若 API 缺失返回用户名，应以输入值为准（由 Hook 行为覆盖）。
 */
test("GivenAccountTab_WhenSavingUsername_ThenApiInvokedAndStoreUpdated", async () => {
  const user = userEvent.setup();
  render(<Preferences />);

  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const panel = screen.getByRole("tabpanel");
  const input = within(panel).getByPlaceholderText(
    mockLanguage.usernamePlaceholder,
  );
  expect(input).toBeDisabled();
  expect(input).toHaveValue(mockUser.username);

  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.changeUsernameButton,
    }),
  );

  expect(input).not.toBeDisabled();
  await user.clear(input);
  await user.type(input, "  ada.glancy  ");

  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.saveUsernameButton,
    }),
  );

  await screen.findByRole("button", {
    name: mockLanguage.changeUsernameButton,
  });

  expect(updateUsernameMock).toHaveBeenCalledWith({
    userId: mockUser.id,
    username: "ada.glancy",
    token: mockUser.token,
  });
  expect(mockSetUser).toHaveBeenCalledWith({
    ...mockUser,
    username: "ada",
  });
  expect(input).toBeDisabled();
});

/**
 * 测试目标：非法用户名应展示错误信息并阻止请求发送。
 * 前置条件：updateUsernameMock 重置但不应被调用。
 * 步骤：
 *  1) 进入编辑态后输入两位字符；
 *  2) 点击保存按钮；
 * 断言：
 *  - 出现最小长度错误文案；
 *  - 输入 aria-invalid 为 true；
 *  - updateUsernameMock 未被调用。
 * 边界/异常：
 *  - 错误信息应结合翻译模板插值最小长度。
 */
test("GivenInvalidUsername_WhenSaving_ThenInlineErrorShown", async () => {
  const user = userEvent.setup();
  render(<Preferences />);

  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const panel = screen.getByRole("tabpanel");
  const input = within(panel).getByPlaceholderText(
    mockLanguage.usernamePlaceholder,
  );

  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.changeUsernameButton,
    }),
  );

  await user.clear(input);
  await user.type(input, "ab");
  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.saveUsernameButton,
    }),
  );

  const error = await within(panel).findByText(/at least 3 characters/);
  expect(error).toBeInTheDocument();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(updateUsernameMock).not.toHaveBeenCalled();
});
