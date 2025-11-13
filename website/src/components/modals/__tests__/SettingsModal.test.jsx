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
  settingsGeneralThemeLabel: "Theme",
  settingsGeneralThemeLight: "Light",
  settingsGeneralThemeDark: "Dark",
  settingsGeneralThemeSystem: "System",
  settingsGeneralLanguageLabel: "Interface language",
  settingsGeneralLanguageOption_en: "English (US)",
  settingsGeneralLanguageOption_zh: "Chinese (Simplified)",
  settingsGeneralMarkdownLabel: "Markdown rendering",
  settingsGeneralMarkdownDynamic: "Render dynamically",
  settingsGeneralMarkdownPlain: "Show raw text",
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
  close: "Close",
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

jest.unstable_mockModule("@/components/modals/BaseModal.jsx", () => ({
  __esModule: true,
  default: function BaseModalStub({ children }) {
    return <div data-testid="base-modal-stub">{children}</div>;
  },
}));

jest.unstable_mockModule("@/components/ui/Icon/index.tsx", () => ({
  __esModule: true,
  default: function IconStub({ name }) {
    return <span data-testid={`icon-${name}`} />;
  },
}));

jest.unstable_mockModule("@/components/AvatarEditorModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/Toast", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/hooks/useSectionFocusManager.js", () => ({
  __esModule: true,
  default: () => ({
    captureFocusOrigin: jest.fn(),
    registerHeading: jest.fn(),
  }),
}));

jest.unstable_mockModule("@/components/modals/useStableSettingsPanelHeight.js", () => ({
  __esModule: true,
  default: () => ({
    bodyStyle: undefined,
    registerActivePanelNode: jest.fn(),
    referenceMeasurement: null,
  }),
}));

const { default: SettingsModal } = await import(
  "@/components/modals/SettingsModal.jsx"
);

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
    },
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
 * 测试目标：确保 SettingsModal 的通用分区展示 Markdown plain 切换选项。
 * 前置条件：
 *  - SettingsModal 以 open 状态渲染，且初始分区设为 general；
 *  - usePreferenceSections 返回实际配置。
 * 步骤：
 *  1) 渲染 SettingsModal；
 *  2) 获取当前激活的 tabpanel。
 * 断言：
 *  - 面板内存在名称为 “Show raw text” 的单选按钮。
 * 边界/异常：
 *  - 若未找到该按钮，说明通用分区未注入 Markdown 控制。
 */
test(
  "GivenSettingsModal_WhenGeneralTabActive_ThenMarkdownPlainToggleVisible",
  () => {
    render(<SettingsModal open onClose={jest.fn()} initialSection="general" />);

    const panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("radio", { name: /Show raw text/i }),
    ).toBeInTheDocument();
  },
);

/**
 * 测试目标：默认打开账户分区时，切换到通用标签应展示 Markdown plain 控件。
 * 前置条件：SettingsModal 初始分区为 account。
 * 步骤：
 *  1) 渲染 SettingsModal；
 *  2) 点击 “General” 标签；
 *  3) 检查当前 tabpanel 中的 Markdown 控制。
 * 断言：
 *  - tabpanel 中存在名称为 “Show raw text” 的单选按钮。
 * 边界/异常：
 *  - 若控件缺失说明 GeneralSection 未正确挂载。
 */
test("GivenSettingsModal_WhenSelectingGeneralTab_ThenMarkdownPlainToggleVisible", async () => {
  render(<SettingsModal open onClose={jest.fn()} initialSection="account" />);

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.settingsTabGeneral),
    }),
  );

  const panel = screen.getByRole("tabpanel");
  expect(
    within(panel).getByRole("radio", { name: /Show raw text/i }),
  ).toBeInTheDocument();
});


/**
 * 测试目标：切换到账户分区后可见账户字段，验证导航与内容同步。
 * 前置条件：
 *  - 使用默认账户上下文；
 *  - SettingsModal 已打开。
 * 步骤：
 *  1) 渲染 SettingsModal；
 *  2) 点击账户标签；
 *  3) 检查面板中的账户信息。
 * 断言：
 *  - 用户名与邮箱字段存在；
 *  - 解绑邮箱按钮可见。
 * 边界/异常：
 *  - 若导航未切换或字段缺失则失败。
 */
test("GivenSettingsModal_WhenSwitchingToAccountTab_ThenAccountFieldsVisible", async () => {
  render(<SettingsModal open onClose={jest.fn()} />);

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const panel = screen.getByRole("tabpanel");
  expect(within(panel).getByText(mockLanguage.settingsAccountUsername)).toBeInTheDocument();
  expect(
    within(panel).getByRole("button", { name: mockLanguage.settingsAccountEmailUnbindAction }),
  ).toBeInTheDocument();
});
