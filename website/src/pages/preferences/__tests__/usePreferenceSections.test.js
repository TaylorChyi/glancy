import { jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockUseLanguage = jest.fn();
const mockUseUser = jest.fn();
const mockUseApi = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useLanguage: mockUseLanguage,
  useUser: mockUseUser,
}));

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: mockUseApi,
}));

let usePreferenceSections;

beforeAll(async () => {
  ({ default: usePreferenceSections } = await import("../usePreferenceSections.js"));
});

const createTranslations = (overrides = {}) => ({
  prefTitle: "Global Preferences",
  prefDescription: "Tailor the workspace to your taste.",
  prefTablistLabel: "Preference sections",
  close: "Close",
  settingsEmptyValue: "—",
  prefAccountTitle: "Account",
  settingsAccountDescription: "Account summary",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountAge: "Age",
  settingsAccountGender: "Gender",
  settingsTabAccount: "Account",
  prefPrivacyTitle: "Privacy",
  prefPrivacyDescription: "Privacy summary",
  prefPrivacyPlaceholder: "Privacy placeholder",
  prefNotificationsTitle: "Notifications",
  prefNotificationsDescription: "Notifications summary",
  prefNotificationsDisabledMessage: "Notifications disabled",
  settingsManageProfile: "Manage profile",
  ...overrides,
});

beforeEach(() => {
  mockUseLanguage.mockReset();
  mockUseUser.mockReset();
  mockUseApi.mockReset();
  mockUseLanguage.mockReturnValue({ t: createTranslations() });
  mockUseUser.mockReturnValue({
    user: { username: "amy", email: "amy@example.com", plan: "plus", isPro: true },
  });
  mockUseApi.mockReturnValue(null);
});

/**
 * 测试目标：默认分区下聚焦标识与模态备用标题字段保持同步。
 * 前置条件：使用默认语言文案与账户信息渲染 Hook。
 * 步骤：
 *  1) 渲染 usePreferenceSections。
 *  2) 读取 panel 结构返回的属性。
 * 断言：
 *  - focusHeadingId 与 headingId 相同且引用 account 分区标题。
 *  - modalHeadingId 固定为备用标题 ID。
 *  - modalHeadingText 取自账户分区标题文本。
 * 边界/异常：
 *  - 若 future 分区缺失标题，应回退到 fallback ID。
 */
test("Given default sections When reading panel metadata Then heading semantics stay aligned", () => {
  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined, onOpenAccountManager: jest.fn() }),
  );

  expect(result.current.panel.headingId).toBe("account-section-heading");
  expect(result.current.panel.focusHeadingId).toBe("account-section-heading");
  expect(result.current.panel.modalHeadingId).toBe("settings-modal-fallback-heading");
  expect(result.current.panel.modalHeadingText).toBe("Account");
});

/**
 * 测试目标：当分区标题文案为空白时，模态备用标题回退至 copy.title。
 * 前置条件：隐私分区标题文案仅包含空格。
 * 步骤：
 *  1) 使用隐私分区空白标题的语言包渲染 Hook，并指定初始分区为 privacy。
 *  2) 读取 panel 对象中的标题字段。
 * 断言：
 *  - modalHeadingText 等于 copy.title。
 *  - focusHeadingId 指向隐私分区 heading。
 * 边界/异常：
 *  - 若 copy.title 为空，也应保持非空字符串（由 Hook 内默认值保障）。
 */
test("Given blank section titles When resolving modal heading Then fallback title is used", () => {
  mockUseLanguage.mockReturnValue({
    t: createTranslations({
      prefPrivacyTitle: "   ",
      prefPrivacyDescription: "   ",
    }),
  });

  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: "privacy", onOpenAccountManager: jest.fn() }),
  );

  expect(result.current.panel.focusHeadingId).toBe("privacy-section-heading");
  expect(result.current.panel.modalHeadingText).toBe(result.current.copy.title);
  expect(result.current.panel.modalHeadingId).toBe("settings-modal-fallback-heading");
});

/**
 * 测试目标：切换分区后备用标题随激活分区更新。
 * 前置条件：默认激活 account 分区。
 * 步骤：
 *  1) 渲染 Hook 并调用 handleSectionSelect 选择 privacy 分区。
 *  2) 读取 panel 的标题字段。
 * 断言：
 *  - modalHeadingText 更新为 Privacy 文案。
 *  - focusHeadingId 更新为 privacy-section-heading。
 * 边界/异常：
 *  - 若分区被禁用，handleSectionSelect 应忽略状态变更（此处不触发）。
 */
test("Given section switch When selecting privacy Then heading metadata updates", async () => {
  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined, onOpenAccountManager: jest.fn() }),
  );

  act(() => {
    result.current.handleSectionSelect({ id: "privacy", disabled: false });
  });

  expect(result.current.activeSectionId).toBe("privacy");

  await waitFor(() => {
    expect(result.current.panel.focusHeadingId).toBe("privacy-section-heading");
    expect(result.current.panel.modalHeadingText).toBe("Privacy");
  });
});
