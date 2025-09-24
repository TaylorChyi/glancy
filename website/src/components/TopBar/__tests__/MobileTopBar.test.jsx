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

const { default: MobileTopBar } = await import(
  "@/components/TopBar/MobileTopBar.jsx"
);

const renderBar = (props = {}) =>
  render(
    <MobileTopBar
      term="mobile"
      lang="en"
      canReoutput
      versions={[{ id: "v1" }, { id: "v2" }]}
      activeVersionId="v2"
      onOpenSidebar={jest.fn()}
      {...props}
    />,
  );

describe("MobileTopBar", () => {
  beforeEach(() => {
    mockTtsButton.mockClear();
  });

  /**
   * 确保 term 存在时渲染 TTS 按钮。
   */
  test("renders tts button when term provided", () => {
    renderBar();
    expect(mockTtsButton).toHaveBeenCalledTimes(1);
    expect(mockTtsButton.mock.calls[0][0]).toEqual(
      expect.objectContaining({ text: "mobile", lang: "en" }),
    );
  });

  /**
   * 确保 term 为空时不会渲染 TTS 按钮。
   */
  test("omits tts button without term", () => {
    renderBar({ term: "" });
    expect(mockTtsButton).not.toHaveBeenCalled();
  });

  /**
   * 验证重新输出按钮响应点击。
   */
  test("fires reoutput callback", () => {
    const onReoutput = jest.fn();
    renderBar({ onReoutput });
    fireEvent.click(screen.getByRole("button", { name: "重新输出" }));
    expect(onReoutput).toHaveBeenCalledTimes(1);
  });

  /**
   * 验证导航按钮传递方向。
   */
  test("passes navigation intent", () => {
    const onNavigate = jest.fn();
    renderBar({ onNavigateVersion: onNavigate });
    fireEvent.click(screen.getByRole("button", { name: "上一版本" }));
    expect(onNavigate).toHaveBeenCalledWith("previous");
  });

  /**
   * 支持注入自定义工具栏。
   */
  test("allows toolbar injection", () => {
    const ToolbarStub = jest.fn(() => <div data-testid="stub" />);
    renderBar({
      toolbarComponent: ToolbarStub,
      toolbarProps: { accent: "bold" },
    });
    expect(ToolbarStub).toHaveBeenCalledTimes(1);
    expect(ToolbarStub.mock.calls[0][0]).toEqual(
      expect.objectContaining({ term: "mobile", accent: "bold" }),
    );
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
});
