/* eslint-env jest */
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

const mockLanguage = {
  prefTitle: "Account preferences",
  prefDescription: "Review and curate your Glancy identity.",
  prefAccountTitle: "Account",
  prefTablistLabel: "Preference sections",
  prefPrivacyTitle: "Privacy",
  prefPrivacyDescription: "Control how you share your data.",
  prefPrivacyPlaceholder: "Privacy settings coming soon.",
  prefNotificationsTitle: "Notifications",
  prefNotificationsDescription: "Keep every alert intentional.",
  prefNotificationsDisabledMessage:
    "Manage notifications in the Glancy mobile app for now.",
  settingsAccountDescription: "Details that travel with your workspace.",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountAge: "Age",
  settingsAccountGender: "Gender",
  settingsTabAccount: "Account",
  settingsEmptyValue: "Not set",
  settingsManageProfile: "Manage profile",
};

let mockUser;
const fetchProfile = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({ t: mockLanguage }),
  useUser: () => ({ user: mockUser }),
}));

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: () => ({
    profiles: { fetchProfile },
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
  fetchProfile.mockReset();
  fetchProfile.mockResolvedValue({ age: 28, gender: "Female" });
});

/**
 * 测试目标：渲染账户摘要表单并校验字段与翻译文案正确显示。
 * 前置条件：提供完整的语言与用户上下文，profile 接口返回年龄与性别。
 * 步骤：
 *  1) 渲染 Preferences 组件。
 *  2) 等待 profile 接口完成。
 * 断言：
 *  - 标题、描述、各字段值与 profile 返回值匹配。
 * 边界/异常：
 *  - 若接口未调用则测试失败，提示数据未拉取。
 */
test("GivenUserContext_WhenRendered_ThenAccountFieldsReflectUserData", async () => {
  render(<Preferences />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  expect(
    screen.getByRole("heading", { name: mockLanguage.prefTitle, level: 2 }),
  ).toBeInTheDocument();
  expect(screen.getByText(mockLanguage.prefDescription)).toBeInTheDocument();

  const activePanel = screen.getByRole("tabpanel");
  expect(
    within(activePanel).getByText(mockLanguage.settingsAccountUsername),
  ).toBeInTheDocument();
  expect(within(activePanel).getByText(mockUser.username)).toBeInTheDocument();
  expect(within(activePanel).getByText(mockUser.email)).toBeInTheDocument();
  expect(within(activePanel).getByText(mockUser.phone)).toBeInTheDocument();
  expect(await within(activePanel).findByText("28")).toBeInTheDocument();
  expect(await within(activePanel).findByText("Female")).toBeInTheDocument();
});

/**
 * 测试目标：当用户信息或 profile 数据缺失时显示占位文案。
 * 前置条件：用户上下文缺少邮箱与电话，profile 返回空值。
 * 步骤：
 *  1) 更新 mockUser 与 profile 返回值为空。
 *  2) 渲染组件并等待请求完成。
 * 断言：
 *  - 对应字段显示 settingsEmptyValue。
 * 边界/异常：
 *  - 若仍显示空字符串，表明回填逻辑未生效。
 */
test("GivenMissingAccountData_WhenRendered_ThenFallbackCopyDisplayed", async () => {
  mockUser = {
    username: "Ada",
    email: "",
    phone: undefined,
    plan: "",
    token: "token-123",
  };
  fetchProfile.mockResolvedValue({ age: null, gender: "" });

  render(<Preferences />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  const fallback = mockLanguage.settingsEmptyValue;
  const activePanel = screen.getByRole("tabpanel");
  expect(within(activePanel).getAllByText(fallback)).toHaveLength(4);
});

/**
 * 测试目标：验证“Manage profile”按钮触发上层回调。
 * 前置条件：传入 onOpenAccountManager 回调。
 * 步骤：
 *  1) 渲染组件并等待 profile 请求。
 *  2) 点击按钮。
 * 断言：
 *  - 回调被调用一次。
 * 边界/异常：
 *  - 若按钮未渲染或未触发回调则测试失败。
 */
test("GivenManageProfileHandler_WhenClicked_ThenDelegateInvoked", async () => {
  const handleOpen = jest.fn();
  render(<Preferences onOpenAccountManager={handleOpen} />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  const activePanel = screen.getByRole("tabpanel");
  const button = within(activePanel).getByRole("button", {
    name: mockLanguage.settingsManageProfile,
  });
  await userEvent.setup().click(button);

  expect(handleOpen).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：在缺少用户上下文时不调用 profile 接口且隐藏管理按钮。
 * 前置条件：mockUser 设为 undefined。
 * 步骤：
 *  1) 将 mockUser 置空并渲染组件。
 * 断言：
 *  - fetchProfile 未被调用。
 *  - 页面不包含 Manage profile 按钮。
 * 边界/异常：
 *  - 若接口被调用则说明守卫逻辑失效。
 */
test("GivenNoUserContext_WhenRendered_ThenProfileRequestSkipped", () => {
  mockUser = undefined;

  render(<Preferences onOpenAccountManager={jest.fn()} />);

  expect(fetchProfile).not.toHaveBeenCalled();
  expect(
    within(screen.getByRole("tabpanel")).queryByRole("button", {
      name: mockLanguage.settingsManageProfile,
    }),
  ).not.toBeInTheDocument();
});

/**
 * 测试目标：验证默认激活标签为配置中的第一个可用标签。
 * 前置条件：使用默认 props 渲染组件。
 * 步骤：
 *  1) 渲染 Preferences 组件。
 * 断言：
 *  - “Account” 标签 aria-selected 为 true，禁用标签保持 disabled 状态。
 * 边界/异常：
 *  - 若默认激活标签不是 Account，说明回退逻辑失效。
 */
test("GivenDefaultConfiguration_WhenRendered_ThenFirstAvailableTabActive", async () => {
  render(<Preferences />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  const accountTab = screen.getByRole("tab", {
    name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
  });
  expect(accountTab).toHaveAttribute("aria-selected", "true");

  const notificationsTab = screen.getByRole("tab", {
    name: (name) => name.startsWith(mockLanguage.prefNotificationsTitle),
  });
  expect(notificationsTab).toBeDisabled();
});

/**
 * 测试目标：验证点击其他标签时面板内容发生切换。
 * 前置条件：准备用户上下文与隐私标签文案。
 * 步骤：
 *  1) 渲染组件等待请求。
 *  2) 点击 Privacy 标签。
 * 断言：
 *  - Privacy 标签被选中，面板展示隐私占位文案。
 * 边界/异常：
 *  - 若内容未切换或 aria-selected 未更新则失败。
 */
test("GivenSecondaryTab_WhenSelected_ThenPanelSwitchesToTarget", async () => {
  render(<Preferences />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  const privacyTab = screen.getByRole("tab", {
    name: (name) => name.startsWith(mockLanguage.prefPrivacyTitle),
  });
  const user = userEvent.setup();
  await user.click(privacyTab);

  expect(privacyTab).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getByText(mockLanguage.prefPrivacyPlaceholder),
  ).toBeInTheDocument();
});

/**
 * 测试目标：校验传入无效初始标签时回退到默认标签。
 * 前置条件：提供 initialTabId 为未知值。
 * 步骤：
 *  1) 渲染组件，传入 initialTabId="unknown"。
 * 断言：
 *  - Account 标签仍被选中。
 * 边界/异常：
 *  - 若选择发生改变则说明防御逻辑失效。
 */
test("GivenInvalidInitialTab_WhenRendered_ThenFallbackToDefaultTab", async () => {
  render(<Preferences initialTabId="unknown" />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  const accountTab = screen.getByRole("tab", {
    name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
  });
  expect(accountTab).toHaveAttribute("aria-selected", "true");
});

/**
 * 测试目标：尝试激活被禁用标签时应保持当前选中态。
 * 前置条件：通知标签默认禁用。
 * 步骤：
 *  1) 渲染组件。
 *  2) 触发对禁用标签的点击行为。
 * 断言：
 *  - Account 标签仍然保持选中。
 * 边界/异常：
 *  - 若禁用标签被选中则说明禁用态失效。
 */
test("GivenDisabledTab_WhenClicked_ThenActiveSelectionRemains", async () => {
  render(<Preferences />);

  await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

  const accountTab = screen.getByRole("tab", {
    name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
  });
  const notificationsTab = screen.getByRole("tab", {
    name: (name) => name.startsWith(mockLanguage.prefNotificationsTitle),
  });

  const user = userEvent.setup();
  await user.click(notificationsTab);

  expect(accountTab).toHaveAttribute("aria-selected", "true");
  expect(notificationsTab).toHaveAttribute("aria-selected", "false");
});

/**
 * 测试目标：验证传入 renderCloseAction 时关闭按钮在标签区域可见并触发回调。
 * 前置条件：renderCloseAction 返回带有自定义 className 的按钮，onClose 回调为 jest.fn。
 * 步骤：
 *  1) 渲染 Preferences，传入 renderCloseAction。
 *  2) 等待 profile 请求完成。
 *  3) 点击关闭按钮。
 * 断言：
 *  - 渲染钩子被调用并接收到布局层提供的 className。
 *  - 关闭按钮位于标签列表之前且点击后触发 onClose。
 * 边界/异常：
 *  - 若渲染钩子未调用或按钮未触发回调则失败。
 */
test(
  "GivenCloseRenderer_WhenRendered_ThenButtonVisibleAndOnCloseInvoked",
  async () => {
    const handleClose = jest.fn();
    const renderCloseAction = jest.fn(({ className }) => (
      <button
        type="button"
        onClick={handleClose}
        className={`custom-class ${className}`}
      >
        Close
      </button>
    ));

    render(<Preferences renderCloseAction={renderCloseAction} />);

    await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1));

    expect(renderCloseAction).toHaveBeenCalledTimes(1);
    expect(renderCloseAction.mock.calls[0][0].className).toBeTruthy();

    const closeButton = screen.getByRole("button", { name: "Close" });
    const tablist = screen.getByRole("tablist");
    expect(closeButton.className).toMatch(/custom-class/);
    expect(
      closeButton.compareDocumentPosition(tablist) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const user = userEvent.setup();
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  },
);
