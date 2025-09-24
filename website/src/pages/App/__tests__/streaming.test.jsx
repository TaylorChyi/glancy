import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
jest.unstable_mockModule("remark-gfm", () => ({ default: () => {} }));

// simplify layout and nested components for isolated testing
jest.unstable_mockModule("@/components/Layout", () => ({
  default: ({ bottomContent, children, sidebarProps, topBarProps }) => (
    <div>
      {topBarProps && (
        <div>
          <button
            data-testid="topbar-reoutput"
            onClick={topBarProps.onReoutput}
            disabled={!topBarProps.canReoutput}
          />
          <button
            data-testid="topbar-prev"
            onClick={() => topBarProps.onNavigateVersion?.("previous")}
          />
          <button
            data-testid="topbar-next"
            onClick={() => topBarProps.onNavigateVersion?.("next")}
          />
        </div>
      )}
      {sidebarProps && (
        <button
          data-testid="history-select"
          onClick={() => sidebarProps.onSelectHistory("foo", undefined)}
        />
      )}
      <div>{children}</div>
      {bottomContent}
    </div>
  ),
}));
const renderMarkdown = (content) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return <p>{""}</p>;
  }
  if (trimmed.startsWith("# ")) {
    return <h1>{trimmed.replace(/^#\s*/, "")}</h1>;
  }
  return <p>{content}</p>;
};

const MockDictionaryEntry = ({ entry }) => {
  if (!entry) {
    return <div data-testid="entry" />;
  }
  if (entry.markdown) {
    return <div data-testid="entry">{renderMarkdown(entry.markdown)}</div>;
  }
  return <div data-testid="entry">{entry.term ?? ""}</div>;
};

const MockDictionaryEntryView = ({ entry, preview }) => {
  if (entry) {
    return <MockDictionaryEntry entry={entry} />;
  }
  if (preview) {
    return renderMarkdown(preview);
  }
  return null;
};

jest.unstable_mockModule("@/components/ui/DictionaryEntry", () => ({
  default: MockDictionaryEntry,
  DictionaryEntryView: MockDictionaryEntryView,
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
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={1}
      />
    </form>
  ),
}));
jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

// mock contexts
jest.unstable_mockModule("@/context", () => ({
  useHistory: () => ({
    history: [],
    loadHistory: jest.fn(),
    addHistory: jest.fn(),
    unfavoriteHistory: jest.fn(),
    removeHistory: jest.fn(),
  }),
  useUser: () => ({ user: { id: "1", token: "t" } }),
  useFavorites: () => ({ favorites: [], toggleFavorite: jest.fn() }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
  useLanguage: () => ({
    t: {
      searchPlaceholder: "search",
      inputPlaceholder: "input",
      reoutput: "重新输出",
      previousVersion: "上一版本",
      nextVersion: "下一版本",
      versionIndicator: "{current}/{total}",
      versionIndicatorEmpty: "0/0",
      back: "返回",
    },
    lang: "en",
    setLang: jest.fn(),
  }),
}));

// mock stores and hooks
const streamMock = jest.fn();
jest.unstable_mockModule("@/hooks", () => ({
  useStreamWord: streamMock,
  useSpeechInput: () => ({ start: jest.fn() }),
  useAppShortcuts: () => ({ toggleFavoriteEntry: jest.fn() }),
  useApi: () => ({ words: {} }),
  useMediaQuery: () => false,
}));

const { default: App } = await import("@/pages/App");
const { useStreamWord } = await import("@/hooks");
const { useWordStore } = await import("@/store/wordStore.js");
const { wordCacheKey } = await import("@/api/words.js");

beforeEach(() => {
  useStreamWord.mockReset();
  useWordStore.getState().clear();
});

/**
 * 验证流式内容在 Markdown 容器中逐字呈现，解析失败时最终文本仍会保留。
 */
test("streams text with markdown and preserves final output", async () => {
  useStreamWord.mockImplementation(
    () =>
      async function* () {
        const chunks = ["f", "o", "o", "b", "a", "r"];
        for (const c of chunks) {
          yield { chunk: c };
          await new Promise((r) => setTimeout(r, 10));
        }
      },
  );

  render(<App />);

  const input = screen.getByPlaceholderText("input");
  fireEvent.change(input, { target: { value: "hello\nworld" } });
  fireEvent.submit(input.closest("form"));

  await screen.findByText("f");
  await screen.findByText("fo");
  const paragraph = await screen.findByText("foobar");
  expect(paragraph.tagName).toBe("P");

  await waitFor(() => {
    expect(screen.getByText("foobar")).toBeInTheDocument();
  });
});

/**
 * 确认流完成后仍能使用现有组件呈现最终结果。
 */
test("renders dictionary entry after streaming completes", async () => {
  useStreamWord.mockImplementation(
    () =>
      async function* () {
        yield { chunk: '{"term":"hel' };
        await new Promise((r) => setTimeout(r, 10));
        yield { chunk: 'lo"}' };
      },
  );

  render(<App />);

  const input = screen.getByPlaceholderText("input");
  fireEvent.change(input, { target: { value: "hello\nworld" } });
  fireEvent.submit(input.closest("form"));

  const entry = await screen.findByTestId("entry");
  expect(entry).toHaveTextContent("hello");
});

/**
 * 验证选择历史记录时解析失败的内容仍然会展示。
 */
test("shows markdown when history item cannot be parsed", async () => {
  useStreamWord.mockImplementation(
    () =>
      async function* () {
        yield { chunk: "hello" };
      },
  );

  render(<App />);

  fireEvent.click(screen.getByTestId("history-select"));

  const paragraph = await screen.findByText("hello");
  expect(paragraph.tagName).toBe("P");
});

/**
 * 验证流式 JSON 数据时能够提前渲染 markdown 字段。
 */
test("renders markdown preview from streaming json", async () => {
  useStreamWord.mockImplementation(
    () =>
      async function* () {
        const chunks = [
          '{"term":"foo","markdown":"# Ti',
          'tle","language":"ENGLISH"}',
        ];
        for (const c of chunks) {
          yield { chunk: c };
          await new Promise((r) => setTimeout(r, 10));
        }
      },
  );

  render(<App />);

  const input = screen.getByPlaceholderText("input");
  fireEvent.change(input, { target: { value: "word" } });
  fireEvent.submit(input.closest("form"));

  const heading = await screen.findByRole("heading", { name: "Title" });
  expect(heading).toBeInTheDocument();
});

/**
 * 验证重新输出按钮以 forceNew 参数重新发起流并在新流开始前清空旧展示。
 */
test("reoutput triggers forceNew stream and resets view before streaming", async () => {
  const generator = jest
    .fn()
    .mockImplementationOnce(async function* () {
      yield { chunk: '{"term":"foo","markdown":"# First"}' };
    })
    .mockImplementationOnce(async function* (options) {
      expect(options.forceNew).toBe(true);
      yield { chunk: '{"term":"foo","markdown":"# Second' };
      await new Promise((resolve) => setTimeout(resolve, 50));
      yield { chunk: ' Chapter"}' };
    });

  useStreamWord.mockImplementation(() => generator);

  render(<App />);

  const input = screen.getByPlaceholderText("input");
  fireEvent.change(input, { target: { value: "foo" } });
  fireEvent.submit(input.closest("form"));

  await screen.findByRole("heading", { name: "First" });

  fireEvent.click(screen.getByTestId("topbar-reoutput"));

  await waitFor(() => expect(generator).toHaveBeenCalledTimes(2));
  await waitFor(() => {
    expect(
      screen.queryByRole("heading", { name: "First" }),
    ).not.toBeInTheDocument();
  });

  await screen.findByRole("heading", { name: "Second Chapter" });
  expect(generator.mock.calls[1][0].forceNew).toBe(true);
});

/**
 * 验证版本切换按钮会根据缓存版本更新视图。
 */
test("navigates between cached versions", async () => {
  useStreamWord.mockImplementation(
    () =>
      async function* () {
        yield {
          chunk: JSON.stringify({
            term: "foo",
            markdown: "# First",
            versions: [
              { id: "v1", term: "foo", markdown: "# First" },
              { id: "v2", term: "foo", markdown: "# Second" },
            ],
            activeVersionId: "v1",
          }),
        };
        const cacheKey = wordCacheKey({ term: "foo", language: "ENGLISH" });
        useWordStore.getState().setVersions(cacheKey, [
          { id: "v1", term: "foo", markdown: "# First" },
          { id: "v2", term: "foo", markdown: "# Second" },
        ]);
        useWordStore.getState().setActiveVersion(cacheKey, "v1");
      },
  );

  render(<App />);

  const input = screen.getByPlaceholderText("input");
  fireEvent.change(input, { target: { value: "foo" } });
  fireEvent.submit(input.closest("form"));

  await screen.findByRole("heading", { name: "First" });

  fireEvent.click(screen.getByTestId("topbar-next"));

  const second = await screen.findByRole("heading", { name: "Second" });
  expect(second).toBeInTheDocument();
});
