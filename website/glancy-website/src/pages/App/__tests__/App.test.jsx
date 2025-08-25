/* eslint-env jest */
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockNavigate = jest.fn();
const mockStreamWord = jest.fn();

jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.unstable_mockModule("@/components/ui/MessagePopup", () => ({
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/DictionaryEntry", () => ({
  default: ({ entry }) => <div data-testid="entry">{entry.term}</div>,
}));

jest.unstable_mockModule("@/components/ui/ChatInput", () => ({
  default: ({ value, onChange, onSubmit }) => (
    <form data-testid="chat-form" onSubmit={onSubmit}>
      <input data-testid="chat-input" value={value} onChange={onChange} />
      <button type="submit">Send</button>
    </form>
  ),
}));

jest.unstable_mockModule("@/components/Layout", () => ({
  default: ({ children, bottomContent }) => (
    <div>
      {children}
      {bottomContent}
    </div>
  ),
}));

jest.unstable_mockModule("@/components/ui/HistoryDisplay", () => ({
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/ICP", () => ({
  default: () => null,
}));

jest.unstable_mockModule("../FavoritesView.jsx", () => ({
  default: () => null,
}));

jest.unstable_mockModule("@/hooks", () => ({
  useStreamWord: () => mockStreamWord,
  useSpeechInput: () => ({ start: jest.fn() }),
  useAppShortcuts: () => ({ toggleFavoriteEntry: jest.fn() }),
}));

jest.unstable_mockModule("@/context", () => ({
  useHistory: () => ({
    loadHistory: jest.fn(),
    addHistory: jest.fn(),
    unfavoriteHistory: jest.fn(),
  }),
  useUser: () => ({ user: {} }),
  useFavorites: () => ({ favorites: [], toggleFavorite: jest.fn() }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
  useLanguage: () => ({
    t: { searchPlaceholder: "search", inputPlaceholder: "input" },
    lang: "en",
    setLang: jest.fn(),
  }),
}));

jest.unstable_mockModule("@/store", () => ({
  useModelStore: () => ({ model: "m" }),
}));

const { default: App } = await import("../index.jsx");

describe("App search result rendering", () => {
  beforeEach(() => {
    mockStreamWord.mockReset();
  });

  test("renders dictionary entry when JSON is parsed", async () => {
    mockStreamWord.mockImplementation(async function* () {
      yield { chunk: '{"term":"hello"}' };
    });

    render(<App />);
    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "hello" },
    });
    fireEvent.submit(screen.getByTestId("chat-form"));

    await waitFor(() =>
      expect(screen.getByTestId("entry")).toHaveTextContent("hello"),
    );
  });

  test("renders markdown when JSON parse fails", async () => {
    mockStreamWord.mockImplementation(async function* () {
      yield { chunk: "Hello world" };
    });

    render(<App />);
    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "hello" },
    });
    fireEvent.submit(screen.getByTestId("chat-form"));

    await waitFor(() =>
      expect(screen.getByText("Hello world")).toBeInTheDocument(),
    );
  });
});
