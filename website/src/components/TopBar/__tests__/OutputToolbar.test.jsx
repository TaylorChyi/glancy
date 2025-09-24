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
    },
    lang: "zh",
  }),
  useTheme: () => ({ resolvedTheme: "light" }),
}));

jest.unstable_mockModule("@/components", () => ({
  TtsButton: mockTtsButton,
}));

const { default: OutputToolbar } = await import(
  "@/components/TopBar/OutputToolbar.jsx"
);

describe("OutputToolbar", () => {
  beforeEach(() => {
    mockTtsButton.mockClear();
  });

  /**
   * 验证语音按钮仅在 term 存在时渲染，并保留 reoutput 功能。
   */
  test("renders tts when term provided and handles reoutput", () => {
    const onReoutput = jest.fn();
    render(
      <OutputToolbar
        term="hello"
        lang="en"
        onReoutput={onReoutput}
        versions={[{ id: "v1" }]}
      />,
    );

    expect(mockTtsButton).toHaveBeenCalledTimes(1);
    expect(mockTtsButton.mock.calls[0][0]).toEqual(
      expect.objectContaining({ text: "hello", lang: "en" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "重新输出" }));
    expect(onReoutput).toHaveBeenCalledTimes(1);
  });

  /**
   * 验证无 term 时不会渲染语音按钮且导航禁用。
   */
  test("hides tts without term and disables navigation", () => {
    render(<OutputToolbar term="" versions={[]} />);

    expect(mockTtsButton).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "上一版本" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下一版本" })).toBeDisabled();
    expect(screen.getByText("0/0")).toBeInTheDocument();
  });

  /**
   * 验证版本指示器展示正确且导航回调带方向。
   */
  test("shows indicator and emits navigation intent", () => {
    const onNavigate = jest.fn();
    render(
      <OutputToolbar
        term="hello"
        versions={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        activeVersionId="b"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("2/3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一版本" }));
    expect(onNavigate).toHaveBeenCalledWith("next");
    fireEvent.click(screen.getByRole("button", { name: "上一版本" }));
    expect(onNavigate).toHaveBeenCalledWith("previous");
  });

  /**
   * 验证注入自定义 TTS 组件时不会调用默认组件。
   */
  test("prefers injected tts component", () => {
    const customTts = jest.fn(() => <div data-testid="custom-tts" />);
    render(
      <OutputToolbar
        term="hello"
        versions={[{ id: "v1" }]}
        ttsComponent={customTts}
      />,
    );

    expect(customTts).toHaveBeenCalled();
    expect(mockTtsButton).not.toHaveBeenCalled();
  });
});
