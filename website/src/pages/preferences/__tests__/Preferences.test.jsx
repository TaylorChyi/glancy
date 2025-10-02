import { render, screen, waitFor } from "@testing-library/react";
import Preferences from "@/pages/preferences";

jest.mock("@/context", () => ({
  useLanguage: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock("@/hooks/useApi.js", () => ({
  useApi: jest.fn(),
}));

jest.mock("@/components/ui/Avatar", () => (props) => (
  <div data-testid="avatar" {...props} />
));

const { useLanguage, useUser } = jest.requireMock("@/context");
const { useApi } = jest.requireMock("@/hooks/useApi.js");

const baseTranslations = {
  prefTitle: "Preferences",
  prefAccountTitle: "Account essentials",
  settingsAccountDescription: "Review account facts.",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountAge: "Age",
  settingsAccountGender: "Gender",
  settingsEmptyValue: "Not set",
  settingsManageProfile: "Manage profile",
};

beforeEach(() => {
  jest.clearAllMocks();
  useLanguage.mockReturnValue({ t: baseTranslations });
  useUser.mockReturnValue({
    user: {
      username: "Ava",
      email: "ava@glancy.ai",
      phone: "",
      plan: "aurum",
      token: "token",
    },
  });
  useApi.mockReturnValue({
    profiles: {
      fetchProfile: jest.fn().mockResolvedValue({ age: 28, gender: "Female" }),
    },
  });
});

/**
 * 测试目标：Preferences 表单渲染账号标题及主要字段。
 * 前置条件：mock 用户上下文与翻译文案，mock API 返回年龄/性别。
 * 步骤：
 *  1) 渲染组件并等待异步资料回填。
 *  2) 获取表单、标题与字段文案。
 * 断言：
 *  - 表单可通过 aria-labelledby 被获取。
 *  - 主要字段（邮箱、年龄）展示上下文数据。
 * 边界/异常：
 *  - 若 fetchProfile 拒绝，应在控制台记录，但此用例聚焦成功路径。
 */
test("Given context When rendering preferences Then shows account essentials", async () => {
  const onOpenAccountManager = jest.fn();
  render(<Preferences onOpenAccountManager={onOpenAccountManager} />);

  const form = await screen.findByRole("form", {
    name: /Account essentials/i,
  });
  expect(form).toBeInTheDocument();
  expect(screen.getByTestId("avatar")).toBeInTheDocument();
  expect(screen.getByText("Manage profile")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("ava@glancy.ai")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
  });
});

/**
 * 测试目标：当 API 未返回字段时使用默认占位符。
 * 前置条件：mock API 返回空字符串，mock 用户缺失手机号。
 * 步骤：
 *  1) 渲染组件。
 *  2) 等待 detail 字段加载完成。
 * 断言：
 *  - 电话字段显示 "Not set" 占位。
 * 边界/异常：
 *  - 空值逻辑通过 `buildAccountFields` 统一处理。
 */
test("Given missing profile data When rendering Then falls back to placeholder", async () => {
  useUser.mockReturnValueOnce({
    user: {
      username: "Ava",
      email: "ava@glancy.ai",
      phone: "",
      isPro: true,
      token: "token",
    },
  });
  useApi.mockReturnValueOnce({
    profiles: {
      fetchProfile: jest.fn().mockResolvedValue({ age: "", gender: undefined }),
    },
  });

  render(<Preferences />);

  await waitFor(() => {
    expect(screen.getAllByText("Not set").length).toBeGreaterThan(0);
  });
});
