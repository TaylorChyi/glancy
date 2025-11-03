import React from "react";
import { render, fireEvent, screen, within } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockTtsButton = jest.fn(() => <button data-testid="tts" type="button" />);

const userState = { user: { id: "u" } };

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: () => ({
    t: {
      reoutput: "重新输出",
      copyAction: "复制",
      copySuccess: "复制完成",
      deleteButton: "删除",
      report: "反馈",
      dictionarySourceLanguageLabel: "源语言",
      dictionaryTargetLanguageLabel: "目标语言",
    },
    lang: "zh",
  }),
  useTheme: () => ({ resolvedTheme: "light" }),
  useUser: () => userState,
}));

jest.unstable_mockModule("@shared/components", () => ({
  TtsButton: mockTtsButton,
}));

const { default: OutputToolbar } = await import(
  "@shared/components/OutputToolbar"
);

describe("OutputToolbar", () => {
  beforeEach(() => {
    mockTtsButton.mockClear();
    userState.user = { id: "u" };
  });

  /**
   * 验证语音按钮仅在 term 存在时渲染，并保留 reoutput 功能。
   */
  test("renders tts when term provided and handles reoutput", () => {
    const onReoutput = jest.fn();
    render(
      <OutputToolbar term="hello" lang="en" onReoutput={onReoutput} />,
    );

    const toolbar = screen.getByRole("toolbar", { name: "词条工具栏" });
    expect(toolbar.className).toContain("entry__toolbar");
    expect(mockTtsButton).toHaveBeenCalledTimes(1);
    expect(mockTtsButton.mock.calls[0][0]).toEqual(
      expect.objectContaining({ text: "hello", lang: "en" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "重新输出" }));
    expect(onReoutput).toHaveBeenCalledTimes(1);
  });

  /**
   * 验证无 term 时不会渲染语音按钮且复制按钮保持禁用，并确认版本菜单不再出现。
   */
  test("hides tts without term and keeps copy disabled", () => {
    render(<OutputToolbar term="" />);

    expect(mockTtsButton).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "复制" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "选择版本" }),
    ).not.toBeInTheDocument();
  });

  /**
   * 验证注入自定义 TTS 组件时不会调用默认组件。
   */
  test("prefers injected tts component", () => {
    const customTts = jest.fn(() => <div data-testid="custom-tts" />);
    render(<OutputToolbar term="hello" ttsComponent={customTts} />);

    expect(customTts).toHaveBeenCalled();
    expect(mockTtsButton).not.toHaveBeenCalled();
  });

  /**
   * 确认启用动作按钮时在工具栏中渲染并响应交互。
   */
  test("renders action buttons when permitted", () => {
    const onDelete = jest.fn();
    const onReport = jest.fn();
    const onCopy = jest.fn();

    render(
      <OutputToolbar
        term="hello"
        canCopy
        onCopy={onCopy}
        onDelete={onDelete}
        canDelete
        onReport={onReport}
        canReport
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(screen.getByRole("button", { name: "反馈" }));
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：复制成功态下按钮需禁用并显示勾选图标，恢复 idle 后重新启用。
   */
  test("GivenCopySuccessState_WhenRendering_ThenShowsSuccessIconAndDisables", () => {
    const { rerender } = render(
      <OutputToolbar
        term="gamma"
        canCopy
        onCopy={jest.fn()}
        copyFeedbackState="success"
        isCopySuccess
      />,
    );

    const successButton = screen.getByRole("button", { name: "复制完成" });
    expect(successButton).toBeDisabled();
    expect(
      within(successButton).getByRole("img", { name: "copy-success" }),
    ).toBeInTheDocument();

    rerender(
      <OutputToolbar
        term="gamma"
        canCopy
        onCopy={jest.fn()}
        copyFeedbackState="idle"
        isCopySuccess={false}
      />,
    );

    const idleButton = screen.getByRole("button", { name: "复制" });
    expect(idleButton).not.toBeDisabled();
    expect(
      within(idleButton).getByRole("img", { name: "copy" }),
    ).toBeInTheDocument();
  });

  /**
   * 验证 renderRoot 策略可替换默认容器，且仍保留 aria 语义。
   */
  test("supports custom root renderer", () => {
    const renderRoot = jest.fn(
      ({ children, className, role, ariaLabel, dataTestId }) => (
        <section
          data-testid="custom-toolbar"
          data-original-testid={dataTestId}
          data-role={role}
          aria-label={ariaLabel}
          className={`host ${className}`}
        >
          {children}
        </section>
      ),
    );

    render(<OutputToolbar term="hello" renderRoot={renderRoot} />);

    expect(renderRoot).toHaveBeenCalled();
    expect(screen.getByTestId("custom-toolbar")).toHaveAttribute(
      "data-role",
      "toolbar",
    );
  });
});
