/* eslint-env jest */
import React from "react";
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

// mock TtsButton to isolate top bar behaviour
const TtsButton = jest.fn(() => <div data-testid="tts" />);

jest.unstable_mockModule("@/components", () => ({ TtsButton }));

const { default: DesktopTopBar } = await import(
  "@/components/TopBar/DesktopTopBar.jsx"
);

describe("DesktopTopBar", () => {
  afterEach(() => {
    TtsButton.mockClear();
  });

  /**
   * Renders play button when a term is provided.
   */
  test("renders tts button for term", () => {
    render(<DesktopTopBar term="hello" lang="en" />);
    expect(TtsButton).toHaveBeenCalledWith(
      expect.objectContaining({ text: "hello", lang: "en", size: 20 }),
      {},
    );
  });

  /**
   * Omits play button when term is empty.
   */
  test("hides tts button without term", () => {
    render(<DesktopTopBar term="" lang="en" />);
    expect(TtsButton).not.toHaveBeenCalled();
  });

  /**
   * Applies accessible label on back button.
   */
  test("back button has aria-label", () => {
    const { getByLabelText } = render(<DesktopTopBar showBack />);
    expect(getByLabelText("返回")).toBeInTheDocument();
  });
});
