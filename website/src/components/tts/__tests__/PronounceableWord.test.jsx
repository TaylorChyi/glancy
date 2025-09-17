/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

// mock hooks and UI components to isolate pronunciation behavior
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
    },
  }),
  useApiContext: () => ({}),
  useTheme: () => ({ resolvedTheme: "light" }),
  useLocale: () => ({ locale: "en-US" }),
  useAppContext: () => ({}),
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

const { default: PronounceableWord } = await import(
  "@/components/tts/PronounceableWord.jsx"
);

describe("PronounceableWord", () => {
  afterEach(() => {
    play.mockReset();
    stop.mockReset();
    useTtsPlayer.mockClear();
  });

  /**
   * Clicking text invokes play with provided parameters.
   */
  test("invokes play on click", () => {
    const { getByText } = render(<PronounceableWord text="hello" lang="en" />);
    fireEvent.click(getByText("hello"));
    expect(play).toHaveBeenCalledWith({
      text: "hello",
      lang: "en",
      voice: undefined,
    });
  });

  /**
   * When already playing, click stops playback.
   */
  test("stops when playing", () => {
    useTtsPlayer.mockReturnValueOnce({
      play,
      stop,
      loading: false,
      playing: true,
      error: null,
    });
    const { getByText } = render(<PronounceableWord text="hi" lang="en" />);
    fireEvent.click(getByText("hi"));
    expect(stop).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  /**
   * Forbidden errors show upgrade popup.
   */
  test("renders upgrade popup on 403 error", async () => {
    useTtsPlayer.mockReturnValueOnce({
      play,
      stop,
      loading: false,
      playing: false,
      error: { code: 403, message: "Pro only" },
    });
    const { findByText } = render(<PronounceableWord text="hi" lang="en" />);
    expect(await findByText("Pro only")).toBeInTheDocument();
    expect(await findByText("升级")).toBeInTheDocument();
  });

  /**
   * Rate limit errors render toast.
   */
  test("renders toast on 429 error", async () => {
    useTtsPlayer.mockReturnValueOnce({
      play,
      stop,
      loading: false,
      playing: false,
      error: { code: 429, message: "Too many" },
    });
    const { findByText } = render(<PronounceableWord text="hi" lang="en" />);
    expect(await findByText("Too many")).toBeInTheDocument();
  });

  /**
   * Localized aria-label remains accessible via translations.
   */
  test("applies localized aria label", () => {
    const { getByRole } = render(<PronounceableWord text="word" lang="en" />);
    expect(
      getByRole("button", { name: "Play word audio" }),
    ).toBeInTheDocument();
  });
});
