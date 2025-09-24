import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockTtsButton = jest.fn(() => <button data-testid="tts" type="button" />);

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({
    t: {
      reoutput: "重新输出",
      previousVersion: "上一版本",
      nextVersion: "下一版本",
      versionIndicator: "{current}/{total}",
      versionIndicatorEmpty: "0/0",
      back: "返回",
      share: "分享",
      report: "反馈",
    },
    lang: "zh",
  }),
  useTheme: () => ({ resolvedTheme: "light" }),
  useUser: () => ({ user: { id: "u" } }),
  useApiContext: () => ({}),
}));

jest.unstable_mockModule("@/components", () => ({
  TtsButton: mockTtsButton,
}));

const { default: DesktopTopBar } = await import(
  "@/components/TopBar/DesktopTopBar.jsx"
);

const renderBar = (props = {}) =>
  render(
    <DesktopTopBar
      term="term"
      lang="en"
      canReoutput
      versions={[{ id: "v1" }, { id: "v2" }]}
      activeVersionId="v1"
      {...props}
    />,
  );

describe("DesktopTopBar", () => {
  beforeEach(() => {
    mockTtsButton.mockClear();
  });

  /**
   * 确认在提供 term 时会渲染语音按钮且带入语言参数。
   */
  test("renders tts button when term provided", () => {
    renderBar();
    expect(mockTtsButton).toHaveBeenCalledTimes(1);
    expect(mockTtsButton.mock.calls[0][0]).toEqual(
      expect.objectContaining({ text: "term", lang: "en" }),
    );
  });

  /**
   * 确认无 term 时不会渲染语音按钮，避免空调用。
   */
  test("omits tts button without term", () => {
    renderBar({ term: "" });
    expect(mockTtsButton).not.toHaveBeenCalled();
  });

  /**
   * 支持通过 props 注入定制 TTS 组件。
   */
  test("respects injected tts component", () => {
    const customTts = jest.fn(() => <div data-testid="custom-tts" />);
    renderBar({ ttsComponent: customTts });
    expect(customTts).toHaveBeenCalled();
    expect(mockTtsButton).not.toHaveBeenCalled();
  });

  /**
   * 验证重新输出按钮可以触发回调。
   */
  test("fires reoutput callback", () => {
    const onReoutput = jest.fn();
    renderBar({ onReoutput });
    fireEvent.click(screen.getByRole("button", { name: "重新输出" }));
    expect(onReoutput).toHaveBeenCalledTimes(1);
  });

  /**
   * 验证版本导航按钮会向上传递方向参数。
   */
  test("passes navigation intent", () => {
    const onNavigate = jest.fn();
    renderBar({ onNavigateVersion: onNavigate });
    fireEvent.click(screen.getByRole("button", { name: "下一版本" }));
    expect(onNavigate).toHaveBeenCalledWith("next");
  });

  /**
   * 支持通过 toolbarComponent 覆盖默认工具栏。
   */
  test("allows toolbar injection", () => {
    const ToolbarStub = jest.fn(() => <div data-testid="stub" />);
    renderBar({
      toolbarComponent: ToolbarStub,
      toolbarProps: { tone: "warm" },
    });
    expect(ToolbarStub).toHaveBeenCalledTimes(1);
    expect(ToolbarStub.mock.calls[0][0]).toEqual(
      expect.objectContaining({ term: "term", tone: "warm" }),
    );
  });
});
