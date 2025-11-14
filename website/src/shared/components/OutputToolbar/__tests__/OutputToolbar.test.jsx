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

const renderToolbar = (props) => render(<OutputToolbar {...props} />);

const getTtsCallArgs = () => mockTtsButton.mock.calls.at(0)?.[0];

const getToolbar = () =>
  screen.getByRole("toolbar", { name: "词条工具栏" });

const clickButton = (label) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

const expectCopyButtonState = ({ label, icon, disabled }) => {
  const copyButton = screen.getByRole("button", { name: label });
  if (disabled) {
    expect(copyButton).toBeDisabled();
  } else {
    expect(copyButton).not.toBeDisabled();
  }
  expect(within(copyButton).getByRole("img", { name: icon })).toBeInTheDocument();
  return copyButton;
};

const renderCopyToolbar = (props = {}) =>
  renderToolbar({
    term: "gamma",
    canCopy: true,
    onCopy: jest.fn(),
    ...props,
  });

beforeEach(() => {
  mockTtsButton.mockClear();
  userState.user = { id: "u" };
});

describe("OutputToolbar text to speech", () => {
  test("renders default tts when term provided", () => {
    const onReoutput = jest.fn();
    renderToolbar({ term: "hello", lang: "en", onReoutput });

    expect(getToolbar().className).toContain("entry__toolbar");
    expect(mockTtsButton).toHaveBeenCalledTimes(1);
    expect(getTtsCallArgs()).toEqual(
      expect.objectContaining({ text: "hello", lang: "en" }),
    );

    clickButton("重新输出");
    expect(onReoutput).toHaveBeenCalledTimes(1);
  });

  test("hides default tts when no term and keeps copy disabled", () => {
    renderToolbar({ term: "" });

    expect(mockTtsButton).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "复制" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "选择版本" }),
    ).not.toBeInTheDocument();
  });

  test("prefers injected tts component", () => {
    const customTts = jest.fn(() => <div data-testid="custom-tts" />);
    renderToolbar({ term: "hello", ttsComponent: customTts });

    expect(customTts).toHaveBeenCalled();
    expect(mockTtsButton).not.toHaveBeenCalled();
  });
});

describe("OutputToolbar action buttons", () => {
  test("respond to delete, report and copy", () => {
    const onDelete = jest.fn();
    const onReport = jest.fn();
    const onCopy = jest.fn();

    renderToolbar({
      term: "hello",
      canCopy: true,
      onCopy,
      onDelete,
      canDelete: true,
      onReport,
      canReport: true,
    });

    clickButton("删除");
    clickButton("反馈");
    clickButton("复制");

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  test("shows copy success state then returns to idle", () => {
    const { rerender } = renderCopyToolbar({
      copyFeedbackState: "success",
      isCopySuccess: true,
    });

    expectCopyButtonState({
      label: "复制完成",
      icon: "copy-success",
      disabled: true,
    });

    rerender(
      <OutputToolbar
        term="gamma"
        canCopy
        onCopy={jest.fn()}
        copyFeedbackState="idle"
        isCopySuccess={false}
      />,
    );

    expectCopyButtonState({
      label: "复制",
      icon: "copy",
      disabled: false,
    });
  });
});

describe("OutputToolbar custom root rendering", () => {
  test("uses provided renderRoot", () => {
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

    renderToolbar({ term: "hello", renderRoot });

    expect(renderRoot).toHaveBeenCalled();
    expect(screen.getByTestId("custom-toolbar")).toHaveAttribute(
      "data-role",
      "toolbar",
    );
  });
});
