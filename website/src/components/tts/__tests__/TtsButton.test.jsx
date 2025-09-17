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

jest.unstable_mockModule("@/hooks/useTtsPlayer.js", () => ({ useTtsPlayer }));

const navigate = jest.fn();
jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({
    t: {
      upgrade: "升级",
      playWordAudio: "Play word audio",
      playSentenceAudio: "Play sentence audio",
    },
  }),
  useApiContext: () => ({}),
  useTheme: () => ({ resolvedTheme: "light" }),
  useLocale: () => ({ locale: "en-US" }),
  useAppContext: () => ({}),
}));

jest.unstable_mockModule("@/components/ui/Icon", () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}));

jest.unstable_mockModule("@/components/ui/MessagePopup", () => ({
  __esModule: true,
  default: ({ open, message, children }) =>
    open ? (
      <div>
        <span>{message}</span>
        {children}
      </div>
    ) : null,
}));

jest.unstable_mockModule("@/components/ui/Toast", () => ({
  __esModule: true,
  default: ({ open, message }) => (open ? <div>{message}</div> : null),
}));

jest.unstable_mockModule("@/components/modals/UpgradeModal.jsx", () => ({
  __esModule: true,
  default: () => null,
}));

const { default: TtsButton } = await import("@/components/tts/TtsButton.jsx");

describe("TtsButton", () => {
  afterEach(() => {
    play.mockReset();
    stop.mockReset();
    useTtsPlayer.mockClear();
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
});
