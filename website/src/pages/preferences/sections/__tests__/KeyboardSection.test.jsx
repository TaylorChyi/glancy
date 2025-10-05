import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseLanguage = jest.fn();
const mockUseKeyboardShortcutContext = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useLanguage: mockUseLanguage,
  useKeyboardShortcutContext: mockUseKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
  useTheme: () => ({ theme: "dark", setTheme: jest.fn() }),
}));

let KeyboardSection;

beforeAll(async () => {
  ({ default: KeyboardSection } = await import("../KeyboardSection.jsx"));
});

beforeEach(() => {
  mockUseKeyboardShortcutContext.mockReset();
  mockUseLanguage.mockReturnValue({
    t: {
      shortcutsFocusSearch: "Focus search",
      settingsKeyboardHint: "hint",
      settingsKeyboardRecordingHint: "record",
      settingsKeyboardRecording: "recording",
      settingsKeyboardSaving: "Saving",
      settingsKeyboardReset: "Reset",
      settingsKeyboardOpenPalette: "Open",
      settingsKeyboardEditLabel: "Edit shortcut for {label}",
      settingsKeyboardConflict: "Conflict",
    },
  });
});

/**
 * 测试目标：点击快捷键按钮并录入新组合时应调用 updateShortcut。
 * 前置条件：上下文提供默认快捷键与可用的 updateShortcut。
 * 步骤：
 *  1) 渲染组件并点击第一个快捷键按钮；
 *  2) 触发包含 Ctrl+Shift+P 的 keyDown 事件；
 * 断言：
 *  - updateShortcut 被以规范化后的按键数组调用。
 * 边界/异常：
 *  - 若按键仅为修饰键不应调用（此处不覆盖）。
 */
test("Given focused shortcut When pressing new combo Then invokes update", async () => {
  const updateShortcut = jest.fn().mockResolvedValue();
  mockUseKeyboardShortcutContext.mockReturnValue({
    shortcuts: [
      { action: "FOCUS_SEARCH", keys: ["MOD", "SHIFT", "F"], defaultKeys: ["MOD", "SHIFT", "F"] },
    ],
    updateShortcut,
    resetShortcuts: jest.fn(),
    pendingAction: null,
    errors: {},
    status: "ready",
  });

  render(
    <KeyboardSection
      title="Keyboard"
      message="message"
      headingId="heading"
      descriptionId="desc"
    />,
  );

  const button = screen.getByRole("button", { name: "Edit shortcut for Focus search" });
  fireEvent.click(button);
  fireEvent.keyDown(button, { key: "p", ctrlKey: true, shiftKey: true });

  await waitFor(() => {
    expect(updateShortcut).toHaveBeenCalledWith("FOCUS_SEARCH", [
      "CONTROL",
      "SHIFT",
      "P",
    ]);
  });
});

/**
 * 测试目标：当上下文返回错误信息时组件应展示冲突提示。
 * 前置条件：errors 中包含 FOCUS_SEARCH 的错误标记。
 * 步骤：
 *  1) 渲染组件；
 * 断言：
 *  - 页面出现冲突提示文案。
 * 边界/异常：
 *  - 无。
 */
test("Given conflict error When rendering Then shows conflict message", () => {
  mockUseKeyboardShortcutContext.mockReturnValue({
    shortcuts: [
      { action: "FOCUS_SEARCH", keys: ["MOD", "SHIFT", "F"], defaultKeys: ["MOD", "SHIFT", "F"] },
    ],
    updateShortcut: jest.fn(),
    resetShortcuts: jest.fn(),
    pendingAction: null,
    errors: { FOCUS_SEARCH: "duplicated" },
    status: "ready",
  });

  render(
    <KeyboardSection
      title="Keyboard"
      message="message"
      headingId="heading"
      descriptionId="desc"
    />,
  );

  expect(screen.getByText("Conflict")).toBeInTheDocument();
});

/**
 * 测试目标：点击“恢复默认”按钮时应调用 resetShortcuts。
 * 前置条件：提供可观察的 resetShortcuts mock。
 * 步骤：
 *  1) 渲染组件；
 *  2) 点击恢复按钮。
 * 断言：
 *  - resetShortcuts 被调用一次。
 * 边界/异常：
 *  - 若按钮禁用则不会调用（此处不覆盖）。
 */
test("Given reset button When clicked Then triggers resetShortcuts", () => {
  const resetShortcuts = jest.fn().mockResolvedValue();
  mockUseKeyboardShortcutContext.mockReturnValue({
    shortcuts: [
      { action: "FOCUS_SEARCH", keys: ["MOD", "SHIFT", "F"], defaultKeys: ["MOD", "SHIFT", "F"] },
    ],
    updateShortcut: jest.fn(),
    resetShortcuts,
    pendingAction: null,
    errors: {},
    status: "ready",
  });

  render(
    <KeyboardSection
      title="Keyboard"
      message="message"
      headingId="heading"
      descriptionId="desc"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetShortcuts).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：当 message 为空白时不渲染描述段落且列表不暴露 aria-describedby。
 * 前置条件：提供包含默认快捷键的上下文，并传入仅包含空白的 message。
 * 步骤：
 *  1) 渲染组件；
 * 断言：
 *  - DOM 中不存在 descriptionId 对应元素；
 *  - 列表缺少 aria-describedby 属性。
 * 边界/异常：
 *  - 若未来恢复描述，应更新断言确保属性重新出现。
 */
test("Given empty message When rendering Then omits description semantics", () => {
  mockUseKeyboardShortcutContext.mockReturnValue({
    shortcuts: [
      { action: "FOCUS_SEARCH", keys: ["MOD", "SHIFT", "F"], defaultKeys: ["MOD", "SHIFT", "F"] },
    ],
    updateShortcut: jest.fn(),
    resetShortcuts: jest.fn(),
    pendingAction: null,
    errors: {},
    status: "ready",
  });

  render(
    <KeyboardSection title="Keyboard" message="   " headingId="heading" descriptionId="desc" />,
  );

  expect(document.getElementById("desc")).toBeNull();
  expect(screen.getByRole("list")).not.toHaveAttribute("aria-describedby");
});
