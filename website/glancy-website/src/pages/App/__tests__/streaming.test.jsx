import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

// simplify layout and nested components for isolated testing
jest.unstable_mockModule("@/components/Layout", () => ({
  default: ({ bottomContent, children }) => (
    <div>
      <div>{children}</div>
      {bottomContent}
    </div>
  ),
}));
jest.unstable_mockModule("@/components/ui/DictionaryEntry", () => ({
  default: () => null,
}));
jest.unstable_mockModule("@/components/ui/HistoryDisplay", () => ({
  default: () => null,
}));
jest.unstable_mockModule("@/components/ui/ICP", () => ({
  default: () => null,
}));
jest.unstable_mockModule("@/components/ui/MessagePopup", () => ({
  default: () => null,
}));
jest.unstable_mockModule("@/pages/App/FavoritesView.jsx", () => ({
  default: () => null,
}));
jest.unstable_mockModule("@/components/ui/ChatInput", () => ({
  default: ({ value, onChange, onSubmit, placeholder }) => (
    <form onSubmit={onSubmit}>
      <input value={value} onChange={onChange} placeholder={placeholder} />
    </form>
  ),
}));
jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

// mock contexts
jest.unstable_mockModule("@/context", () => ({
  useHistory: () => ({
    loadHistory: jest.fn(),
    addHistory: jest.fn(),
    unfavoriteHistory: jest.fn(),
  }),
  useUser: () => ({ user: { id: "1", token: "t" } }),
  useFavorites: () => ({ favorites: [], toggleFavorite: jest.fn() }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
  useLanguage: () => ({
    t: { searchPlaceholder: "search", inputPlaceholder: "input" },
    lang: "en",
    setLang: jest.fn(),
  }),
}));

// mock stores and hooks
jest.unstable_mockModule("@/store", () => ({
  useModelStore: () => ({ model: "m" }),
}));
jest.unstable_mockModule("@/hooks", () => ({
  useStreamWord: () =>
    async function* () {
      yield { chunk: "foo" };
      await new Promise((r) => setTimeout(r, 10));
      yield { chunk: "bar" };
      await new Promise((r) => setTimeout(r, 10));
    },
  useSpeechInput: () => ({ start: jest.fn() }),
  useAppShortcuts: () => ({ toggleFavoriteEntry: jest.fn() }),
  useApi: () => ({ words: {} }),
}));

const { default: App } = await import("@/pages/App");

/**
 * 验证 App 在流式词汇查询时能够逐步渲染 Markdown 内容。
 */
test("renders streaming chunks incrementally", async () => {
  render(<App />);

  const input = screen.getByPlaceholderText("input");
  fireEvent.change(input, { target: { value: "hello" } });
  fireEvent.submit(input.closest("form"));

  const first = await screen.findByText("foo");
  expect(first.tagName).toBe("P");

  const second = await screen.findByText("foobar");
  expect(second.tagName).toBe("P");

  await waitFor(() => {
    expect(screen.queryByText("foobar")).not.toBeInTheDocument();
  });
});
