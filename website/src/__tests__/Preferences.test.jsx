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
} from "./fixtures/preferencesTestContext.js";

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
const state = preferencesTestState;
const renderPreferences = (props = {}) =>
  renderWithProviders(<Preferences {...props} />, { withRouter: false });

beforeEach(() => {
  resetPreferencesTestState();
});

/**
 * 测试目标：通用分区默认展示 Markdown 渲染模式选项。
 * 前置条件：
 *  - 偏好设置页面成功渲染并默认激活通用分区；
 *  - 语言上下文未提供文案时落回英文默认值。
 * 步骤：
 *  1) 渲染 Preferences 页面；
 *  2) 获取当前激活的 tabpanel；
 * 断言：
 *  - 面板内存在名称为 “Show raw text” 的单选按钮；
 * 边界/异常：
 *  - 若未查询到该按钮，提示 Markdown 控制未接入通用分区。
 */
test("GivenPreferences_WhenGeneralSectionActive_ThenMarkdownPlainToggleVisible", () => {
  renderPreferences();

  const activePanel = screen.getByRole("tabpanel");
  expect(
    within(activePanel).getByRole("radio", { name: /Show raw text/i }),
  ).toBeInTheDocument();
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
  renderPreferences();

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
    within(activePanel).getByDisplayValue(state.user.username),
  ).toBeInTheDocument();
  expect(
    within(activePanel).getByDisplayValue(state.user.email),
  ).toBeInTheDocument();
  expect(within(activePanel).getByDisplayValue("+1 111")).toBeInTheDocument();
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

  renderPreferences();

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

  expect(state.unbindEmail).toHaveBeenCalledTimes(1);
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
  state.user = makeUser({
    email: "",
    phone: undefined,
    plan: "",
  });

  renderPreferences();

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("tab", {
      name: (name) => name.startsWith(mockLanguage.prefAccountTitle),
    }),
  );

  const fallback = mockLanguage.settingsEmptyValue;
  const activePanel = screen.getByRole("tabpanel");
  expect(within(activePanel).getAllByDisplayValue(fallback)).toHaveLength(2);
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
  const currentUser = state.user;

  renderPreferences();

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
  expect(input).toHaveValue(currentUser.username);

  const changeButtons = within(panel).getAllByRole("button", {
    name: mockLanguage.changeUsernameButton,
  });
  expect(changeButtons).toHaveLength(1);
  await user.click(changeButtons[0]);

  await within(panel).findByRole("button", {
    name: mockLanguage.saveUsernameButton,
  });
  await waitFor(() => {
    expect(
      within(panel).getByPlaceholderText(mockLanguage.usernamePlaceholder),
    ).not.toBeDisabled();
  });

  const editableInput = within(panel).getByPlaceholderText(
    mockLanguage.usernamePlaceholder,
  );
  expect(editableInput).not.toBeDisabled();
  await user.clear(editableInput);
  await user.type(editableInput, "  ada.glancy  ");

  await user.click(
    within(panel).getByRole("button", {
      name: mockLanguage.saveUsernameButton,
    }),
  );

  await screen.findByRole("button", {
    name: mockLanguage.changeUsernameButton,
  });

  expect(state.updateUsername).toHaveBeenCalledWith({
    userId: currentUser.id,
    username: "ada.glancy",
    token: currentUser.token,
  });
  expect(state.setUser).toHaveBeenCalledWith({
    ...currentUser,
    username: "ada",
  });
  expect(editableInput).toBeDisabled();
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

  renderPreferences();

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
  expect(state.updateUsername).not.toHaveBeenCalled();
});
