/* eslint-env jest */
import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./helpers/renderWithProviders.js";
import { makeUser } from "./factories/makeUser.js";
import {
  preferencesLanguageFixture as mockLanguage,
  preferencesTestState,
  resetPreferencesTestState,
} from "../../tests/setup/preferences/index.js";

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

const { default: Preferences } = await import("@app/pages/preferences");
const testState = preferencesTestState;
const renderPreferences = (props = {}) =>
  renderWithProviders(<Preferences {...props} />, { withRouter: false });

const ACCOUNT_TAB_MATCHER = (name) =>
  name.startsWith(mockLanguage.prefAccountTitle);

const getActivePanel = () => screen.getByRole("tabpanel");

const arrangePreferencesPage = () => {
  renderPreferences();
  return { user: userEvent.setup() };
};

const arrangeAccountTab = async () => {
  const setup = arrangePreferencesPage();
  await setup.user.click(
    screen.getByRole("tab", { name: ACCOUNT_TAB_MATCHER }),
  );
  return { ...setup, panel: getActivePanel() };
};

const getUsernameInput = (panel) =>
  within(panel).getByPlaceholderText(mockLanguage.usernamePlaceholder);

const enterUsernameEditMode = async ({ panel, user }) => {
  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.changeUsernameButton,
    }),
  );

  await within(panel).findByRole("button", {
    name: mockLanguage.saveUsernameButton,
  });
};

const saveUsername = async ({ panel, user }) => {
  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.saveUsernameButton,
    }),
  );

  await screen.findByRole("button", {
    name: mockLanguage.changeUsernameButton,
  });
};

beforeEach(() => {
  resetPreferencesTestState();
});

/**
 * 测试目标：通用分区默认展示 Markdown 渲染模式选项。
 */
test("GivenPreferences_WhenGeneralSectionActive_ThenMarkdownPlainToggleVisible", () => {
  // Arrange
  arrangePreferencesPage();

  // Act
  const activePanel = getActivePanel();

  // Assert
  expect(
    within(activePanel).getByRole("radio", { name: /Show raw text/i }),
  ).toBeInTheDocument();
});

/**
 * 测试目标：切换到账户标签后展示账户字段。
 */
test("GivenUserContext_WhenSwitchingToAccountTab_ThenAccountFieldsVisible", async () => {
  // Arrange
  const { panel } = await arrangeAccountTab();
  const scoped = within(panel);

  // Act
  const usernameInput = getUsernameInput(panel);

  // Assert
  expect(scoped.getByText(mockLanguage.settingsAccountUsername)).toBeDefined();
  expect(scoped.getAllByText(mockLanguage.settingsAccountAvatarLabel)).toHaveLength(
    1,
  );
  expect(usernameInput).toBeDisabled();
  expect(usernameInput).toHaveValue(testState.user.username);
  expect(scoped.getByDisplayValue(testState.user.email)).toBeInTheDocument();
  expect(scoped.getByDisplayValue("+1 111")).toBeInTheDocument();
  expect(
    scoped.getByRole("button", { name: mockLanguage.changeAvatar }),
  ).toBeInTheDocument();
  expect(
    scoped.getByRole("button", { name: mockLanguage.changeUsernameButton }),
  ).toBeInTheDocument();
  expect(
    scoped.getByRole("button", {
      name: mockLanguage.settingsAccountEmailUnbindAction,
    }),
  ).toBeInTheDocument();
  expect(
    scoped.getByRole("button", {
      name: mockLanguage.settingsAccountPhoneRebindAction,
    }),
  ).toBeInTheDocument();
  expect(scoped.getByTestId("avatar")).toBeInTheDocument();
});

/**
 * 测试目标：账户分区的绑定占位动作为禁用状态。
 */
test("GivenAccountBindings_WhenFeaturePending_ThenPlaceholderActionsDisabled", async () => {
  // Arrange
  const { panel } = await arrangeAccountTab();
  const scoped = within(panel);

  // Act
  const placeholderActions = scoped.getAllByRole("button", {
    name: mockLanguage.settingsAccountBindingActionPlaceholder,
  });

  // Assert
  expect(
    scoped.getByText(mockLanguage.settingsAccountBindingTitle),
  ).toBeInTheDocument();
  expect(
    scoped.getAllByText(mockLanguage.settingsAccountBindingStatusUnlinked),
  ).toHaveLength(3);
  expect(placeholderActions).toHaveLength(3);
  placeholderActions.forEach((action) => {
    expect(action).toBeDisabled();
  });
});

/**
 * 测试目标：点击“解绑邮箱”触发 emailBinding.unbindEmail。
 */
test("GivenBoundEmail_WhenClickingUnbind_ThenInvokeEmailBindingCommand", async () => {
  // Arrange
  const { panel, user } = await arrangeAccountTab();
  const scoped = within(panel);
  const unbindButton = scoped.getByRole("button", {
    name: mockLanguage.settingsAccountEmailUnbindAction,
  });

  // Act
  await user.click(unbindButton);

  // Assert
  expect(testState.unbindEmail).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：账户字段缺失时使用占位文案。
 */
test("GivenMissingAccountData_WhenSwitchingToAccountTab_ThenFallbackShown", async () => {
  // Arrange
  testState.user = makeUser({
    email: "",
    phone: undefined,
    plan: "",
  });

  const { panel } = await arrangeAccountTab();
  const scoped = within(panel);

  // Act
  const fallbackValues = scoped.getAllByDisplayValue(
    mockLanguage.settingsEmptyValue,
  );

  // Assert
  expect(fallbackValues).toHaveLength(2);
});

/**
 * 测试目标：点击更换用户名后输入框可编辑并成功保存调用 API。
 */
test("GivenAccountTab_WhenSavingUsername_ThenApiInvokedAndStoreUpdated", async () => {
  // Arrange
  const currentUser = testState.user;
  const harness = await arrangeAccountTab();

  // Act
  await enterUsernameEditMode(harness);
  await waitFor(() => expect(getUsernameInput(harness.panel)).not.toBeDisabled());
  const editableInput = getUsernameInput(harness.panel);
  await harness.user.clear(editableInput);
  await harness.user.type(editableInput, "  ada.glancy  ");
  await saveUsername(harness);

  // Assert
  expect(testState.updateUsername).toHaveBeenCalledWith({
    userId: currentUser.id,
    username: "ada.glancy",
    token: currentUser.token,
  });
  expect(testState.setUser).toHaveBeenCalledWith({
    ...currentUser,
    username: "ada",
  });
  expect(editableInput).toBeDisabled();
});

/**
 * 测试目标：非法用户名应展示错误信息并阻止请求发送。
 */
test("GivenInvalidUsername_WhenSaving_ThenInlineErrorShown", async () => {
  // Arrange
  const harness = await arrangeAccountTab();
  await enterUsernameEditMode(harness);
  const input = getUsernameInput(harness.panel);

  // Act
  await harness.user.clear(input);
  await harness.user.type(input, "ab");
  await harness.user.click(
    within(harness.panel).getByRole("button", {
      name: mockLanguage.saveUsernameButton,
    }),
  );

  // Assert
  const error = await within(harness.panel).findByText(/at least 3 characters/);
  expect(error).toBeInTheDocument();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(testState.updateUsername).not.toHaveBeenCalled();
});
