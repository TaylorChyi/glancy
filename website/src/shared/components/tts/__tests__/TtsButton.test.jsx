/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

// mock hooks and icon to isolate button behavior
const play = jest.fn();
const stop = jest.fn();
const useTtsPlayer = jest.fn(() => ({
  play,
  stop,
  loading: false,
  playing: false,
  error: null,
}));

const mockUseTheme = jest.fn(() => ({ resolvedTheme: "light" }));

jest.unstable_mockModule("@shared/hooks/useTtsPlayer.js", () => ({
  useTtsPlayer,
}));

const navigate = jest.fn();
jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: () => ({
    t: {
      upgrade: "升级",
      playWordAudio: "Play word audio",
      playSentenceAudio: "Play sentence audio",
    },
  }),
  useApiContext: () => ({}),
  useTheme: mockUseTheme,
  useAppContext: () => ({}),
}));

jest.unstable_mockModule("@shared/components/ui/Icon", () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}));

jest.unstable_mockModule("@shared/components/ui/MessagePopup", () => ({
  __esModule: true,
  default: ({ open, message, children }) =>
    open ? (
      <div>
        <span>{message}</span>
        {children}
      </div>
    ) : null,
}));

jest.unstable_mockModule("@shared/components/ui/Toast", () => ({
  __esModule: true,
  default: ({ open, message }) => (open ? <div>{message}</div> : null),
}));

jest.unstable_mockModule("@shared/components/modals/UpgradeModal.jsx", () => ({
  __esModule: true,
  default: () => null,
}));

const { default: TtsButton } = await import(
  "@shared/components/tts/TtsButton.jsx"
);

describe("TtsButton", function () {
  afterEach(() => {
    play.mockReset();
    stop.mockReset();
    useTtsPlayer.mockClear();
    mockUseTheme.mockReset();
    mockUseTheme.mockReturnValue({ resolvedTheme: "light" });
  });

  /**
   * Renders button and verifies clicking triggers play with correct params.
   */
  test("invokes play with text and lang", () => {
    const { getByRole } = render(<TtsButton text="hello" lang="en" />);
    fireEvent.click(getByRole("button"));
    expect(play).toHaveBeenCalledWith({
      text: "hello",
      lang: "en",
      voice: undefined,
    });
  });

  /**
   * When already playing, clicking triggers stop instead of play.
   */
  test("stops when playing", () => {
    useTtsPlayer.mockReturnValueOnce({
      play,
      stop,
      loading: false,
      playing: true,
      error: null,
    });
    const { getByRole } = render(<TtsButton text="hi" lang="en" />);
    fireEvent.click(getByRole("button"));
    expect(stop).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  /**
   * Shows upgrade prompt on forbidden errors.
   */
  test("renders upgrade popup on 403 error", async () => {
    useTtsPlayer.mockReturnValueOnce({
      play,
      stop,
      loading: false,
      playing: false,
      error: { code: 403, message: "Pro only" },
    });
    const { findByText } = render(<TtsButton text="hi" lang="en" />);
    expect(await findByText("Pro only")).toBeInTheDocument();
    expect(await findByText("升级")).toBeInTheDocument();
  });

  /**
   * Displays toast on rate limit errors.
   */
  test("renders toast on 429 error", async () => {
    useTtsPlayer.mockReturnValueOnce({
      play,
      stop,
      loading: false,
      playing: false,
      error: { code: 429, message: "Too many" },
    });
    const { findByText } = render(<TtsButton text="hi" lang="en" />);
    expect(await findByText("Too many")).toBeInTheDocument();
  });

  /**
   * Button derives aria-label from translations for each scope.
   */
  test("applies localized tooltip per scope", () => {
    const { getByRole, rerender } = render(<TtsButton text="hi" lang="en" />);
    expect(getByRole("button")).toHaveAttribute(
      "aria-label",
      "Play word audio",
    );

    rerender(<TtsButton text="hi" lang="en" scope="sentence" />);
    expect(getByRole("button")).toHaveAttribute(
      "aria-label",
      "Play sentence audio",
    );
  });

  /**
   * 测试目标：默认态按钮仅暴露基础类名，符合无背景设计。
   * 前置条件：使用默认主题与属性。
   * 步骤：
   *  1) 渲染按钮并读取 className。
   * 断言：
   *  - className 仅包含 button 基础类。
   * 边界/异常：
   *  - 若未来新增视觉语义，需要同步调整期望集合。
   */
  test("GivenDefaultState_WhenRenderingButton_ThenUsesBaseClass", () => {
    const { getByRole } = render(<TtsButton text="hi" lang="en" />);
    expect(getByRole("button").className.split(" ").sort()).toEqual(["button"]);
  });

  /**
   * 测试目标：暗色主题下同样维持基础类，表明色调不再依赖主题差异。
   * 前置条件：mockUseTheme 返回 resolvedTheme 为 dark。
   * 步骤：
   *  1) 渲染按钮并读取 className。
   * 断言：
   *  - className 仍然仅包含 button。
   * 边界/异常：
   *  - 若未来恢复主题化样式，应更新断言。
   */
  test("GivenDarkTheme_WhenRenderingButton_ThenKeepsBaseClass", () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: "dark" });
    const { getByRole } = render(<TtsButton text="hi" lang="en" />);
    expect(getByRole("button").className.split(" ").sort()).toEqual(["button"]);
  });
});
