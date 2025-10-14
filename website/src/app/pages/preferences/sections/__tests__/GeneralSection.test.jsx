import React from "react";
import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSetTheme = jest.fn();
const mockSetSystemLanguage = jest.fn();
const mockSetMarkdownRenderingMode = jest.fn();
const mockSetChatCompletionMode = jest.fn();
const themeState = { theme: "light" };
const languageState = { value: "auto" };
const settingsState = {
  markdownRenderingMode: "dynamic",
  chatCompletionMode: "stream",
};

const createTranslations = () => ({
  prefTheme: "Theme",
  prefSystemLanguage: "System language",
  prefSystemLanguageAuto: "Match device language",
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
  settingsGeneralChatOutputLabel: "Chat response",
  settingsGeneralChatOutputStream: "Stream responses",
  settingsGeneralChatOutputSync: "Send when ready",
});

jest.unstable_mockModule("@core/context", () => ({
  useTheme: () => ({ theme: themeState.theme, setTheme: mockSetTheme }),
  useLanguage: () => ({
    t: createTranslations(),
    systemLanguage: languageState.value,
    setSystemLanguage: mockSetSystemLanguage,
  }),
}));

jest.unstable_mockModule("@core/store/settings", () => ({
  SUPPORTED_SYSTEM_LANGUAGES: ["en", "zh"],
  MARKDOWN_RENDERING_MODE_DYNAMIC: "dynamic",
  MARKDOWN_RENDERING_MODE_PLAIN: "plain",
  CHAT_COMPLETION_MODE_STREAMING: "stream",
  CHAT_COMPLETION_MODE_SYNC: "sync",
  useSettingsStore: (selector) =>
    selector({
      ...settingsState,
      setMarkdownRenderingMode: mockSetMarkdownRenderingMode,
      setChatCompletionMode: mockSetChatCompletionMode,
    }),
}));

let GeneralSection;

beforeAll(async () => {
  ({ default: GeneralSection } = await import("../GeneralSection.jsx"));
});

beforeEach(() => {
  mockSetTheme.mockClear();
  mockSetSystemLanguage.mockClear();
  themeState.theme = "light";
  languageState.value = "auto";
  settingsState.markdownRenderingMode = "dynamic";
  settingsState.chatCompletionMode = "stream";
  mockSetMarkdownRenderingMode.mockClear();
  mockSetChatCompletionMode.mockClear();
});

/**
 * 测试目标：默认渲染时展示当前主题与语言的选中态。
 * 前置条件：主题设为 light，系统语言为 auto。
 * 步骤：
 *  1) 渲染 GeneralSection。
 * 断言：
 *  - Light 选项 aria-checked 为 true。
 *  - 语言下拉框选中 Match device language。
 * 边界/异常：
 *  - 若 aria-checked 未正确反映状态则提示绑定失败。
 */
test("Given initial preferences When rendered Then current selection highlighted", () => {
  render(
    <GeneralSection title="General" headingId="general-section-heading" />,
  );

  expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  const languageTrigger = screen.getByRole("button", {
    name: "Interface language",
  });
  expect(languageTrigger).toHaveAttribute("data-fullwidth", "true");
  expect(languageTrigger).toHaveTextContent(/Match device language/i);
  expect(
    screen.getByRole("radio", { name: "Render dynamically" }),
  ).toHaveAttribute("aria-checked", "true");
  expect(
    screen.getByRole("radio", { name: "Stream responses" }),
  ).toHaveAttribute("aria-checked", "true");
});

/**
 * 测试目标：点击主题选项会调用 setTheme 更新偏好。
 * 前置条件：主题初始为 light。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击 Dark 选项。
 * 断言：
 *  - setTheme 被以 "dark" 调用一次。
 * 边界/异常：
 *  - 若重复点击当前主题不应触发额外调用。
 */
test("Given theme options When selecting another theme Then delegate invoked", async () => {
  const user = userEvent.setup();
  render(
    <GeneralSection title="General" headingId="general-section-heading" />,
  );

  await user.click(screen.getByRole("radio", { name: "Dark" }));

  expect(mockSetTheme).toHaveBeenCalledTimes(1);
  expect(mockSetTheme).toHaveBeenCalledWith("dark");
});

/**
 * 测试目标：切换语言下拉框触发 setSystemLanguage。
 * 前置条件：系统语言初始为 auto。
 * 步骤：
 *  1) 渲染组件。
 *  2) 选择 English (US)。
 * 断言：
 *  - setSystemLanguage 收到 "en"。
 * 边界/异常：
 *  - 重复选择当前值不应重复触发。
 */
test("Given language menu When choosing locale Then system language updated", async () => {
  const user = userEvent.setup();
  render(
    <GeneralSection title="General" headingId="general-section-heading" />,
  );

  await user.click(screen.getByRole("button", { name: "Interface language" }));
  await user.click(
    screen.getByRole("menuitemradio", { name: /English \(US\)/i }),
  );

  expect(mockSetSystemLanguage).toHaveBeenCalledTimes(1);
  expect(mockSetSystemLanguage).toHaveBeenCalledWith("en");
});

/**
 * 测试目标：Markdown 渲染开关切换到原始文本时调用设置器。
 * 前置条件：Markdown 模式初始为 dynamic。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击 "Show raw text" 选项。
 * 断言：
 *  - setMarkdownRenderingMode 接收到 "plain"。
 * 边界/异常：
 *  - 若当前模式已为 plain 不应重复调用。
 */
test("Given markdown toggle When selecting plain mode Then preference updated", async () => {
  const user = userEvent.setup();
  render(
    <GeneralSection title="General" headingId="general-section-heading" />,
  );

  await user.click(screen.getByRole("radio", { name: "Show raw text" }));

  expect(mockSetMarkdownRenderingMode).toHaveBeenCalledTimes(1);
  expect(mockSetMarkdownRenderingMode).toHaveBeenCalledWith("plain");
});

/**
 * 测试目标：切换聊天输出模式时调用 setChatCompletionMode。
 * 前置条件：初始模式为流式。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击 "Send when ready" 选项。
 * 断言：
 *  - setChatCompletionMode 收到 "sync"。
 * 边界/异常：
 *  - 重复选择当前值不触发调用。
 */
test("Given chat output toggle When selecting sync Then preference updated", async () => {
  const user = userEvent.setup();
  render(
    <GeneralSection title="General" headingId="general-section-heading" />,
  );

  await user.click(screen.getByRole("radio", { name: "Send when ready" }));

  expect(mockSetChatCompletionMode).toHaveBeenCalledTimes(1);
  expect(mockSetChatCompletionMode).toHaveBeenCalledWith("sync");
});
