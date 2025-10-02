/* eslint-env jest */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

const mockLanguage = {
  prefTitle: "Account preferences",
  prefDescription: "Review and curate your Glancy identity.",
  prefAccountTitle: "Account",
  settingsAccountDescription: "Details that travel with your workspace.",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountAge: "Age",
  settingsAccountGender: "Gender",
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

  expect(
    screen.getByText(mockLanguage.settingsAccountUsername),
  ).toBeInTheDocument();
  expect(screen.getByText(mockUser.username)).toBeInTheDocument();
  expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  expect(screen.getByText(mockUser.phone)).toBeInTheDocument();
  expect(await screen.findByText("28")).toBeInTheDocument();
  expect(await screen.findByText("Female")).toBeInTheDocument();
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
  expect(screen.getAllByText(fallback)).toHaveLength(4);
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

  const button = screen.getByRole("button", {
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
    screen.queryByRole("button", {
      name: mockLanguage.settingsManageProfile,
    }),
  ).not.toBeInTheDocument();
});
