import { renderHook, act, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockNavigate = jest.fn();
const mockHistoryApi = {
  history: [],
  loadHistory: jest.fn(),
  addHistory: jest.fn(),
  unfavoriteHistory: jest.fn(),
  removeHistory: jest.fn(),
};
const mockUserState = { user: { id: "user-id" } };
const mockFavoritesApi = { favorites: [], toggleFavorite: jest.fn() };
const mockThemeApi = { theme: "light", setTheme: jest.fn() };
const translationFixture = {
  dictionarySourceLanguageAuto: "自动检测",
  dictionarySourceLanguageAutoDescription: "自动识别语言",
  dictionarySourceLanguageEnglish: "英文",
  dictionarySourceLanguageEnglishDescription: "使用英文解释",
  dictionarySourceLanguageChinese: "中文",
  dictionarySourceLanguageChineseDescription: "使用中文解释",
  dictionaryTargetLanguageChinese: "中文",
  dictionaryTargetLanguageChineseDescription: "输出中文",
  dictionaryTargetLanguageEnglish: "英文",
  dictionaryTargetLanguageEnglishDescription: "输出英文",
  dictionaryTargetLanguageLabel: "目标语言",
  dictionarySourceLanguageLabel: "源语言",
  dictionarySwapLanguages: "切换",
  favoritesEmptyTitle: "暂无收藏",
  favoritesEmptyDescription: "收藏后可快速访问",
  favoritesEmptyAction: "去查询",
  favoriteRemove: "移除收藏",
  searchEmptyTitle: "开始探索",
  searchEmptyDescription: "输入任何词汇即可获取解释",
  inputPlaceholder: "输入查询内容",
  copyAction: "复制",
  copySuccess: "复制成功",
  copyEmpty: "无内容",
  copyFailed: "复制失败",
  copyUnavailable: "不可复制",
  shareMessage: "分享 {term}",
  shareSuccess: "分享完成",
  share: "分享",
  shareCopySuccess: "复制链接",
  shareFailed: "分享失败",
  reportUnavailable: "无法报告",
  reportFailed: "报告失败",
  report: "报告",
  reportSuccess: "报告成功",
};
const mockLanguageApi = {
  t: translationFixture,
  lang: "en",
  setLang: jest.fn(),
};
const mockToggleFavoriteEntry = jest.fn();
const mockStartSpeech = jest.fn();
const mockStreamWord = jest.fn(() => (async function* () {})());
const mockGetRecord = jest.fn(() => null);
const mockGetEntry = jest.fn(() => null);
const mockSetActiveVersion = jest.fn();
const mockSettingsState = {
  dictionarySourceLanguage: "AUTO",
  dictionaryTargetLanguage: "CHINESE",
  setDictionarySourceLanguage: jest.fn(),
  setDictionaryTargetLanguage: jest.fn(),
};
const mockWordStoreState = { entries: {} };

jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.unstable_mockModule("@/context", () => ({
  useHistory: () => mockHistoryApi,
  useUser: () => mockUserState,
  useFavorites: () => mockFavoritesApi,
  useTheme: () => mockThemeApi,
  useLanguage: () => mockLanguageApi,
}));

jest.unstable_mockModule("@/hooks", () => ({
  useStreamWord: () => mockStreamWord,
  useSpeechInput: () => ({ start: mockStartSpeech }),
  useAppShortcuts: () => ({ toggleFavoriteEntry: mockToggleFavoriteEntry }),
}));

jest.unstable_mockModule("@/utils", () => ({
  extractMarkdownPreview: jest.fn(() => null),
  resolveDictionaryConfig: jest.fn(() => ({
    language: "ENGLISH",
    flavor: "default",
  })),
  resolveDictionaryFlavor: jest.fn(() => "default"),
  WORD_LANGUAGE_AUTO: "AUTO",
  normalizeWordSourceLanguage: jest.fn((value) => value ?? "AUTO"),
  normalizeWordTargetLanguage: jest.fn((value) => value ?? "CHINESE"),
  resolveShareTarget: jest.fn(() => "https://example.com"),
  attemptShareLink: jest.fn(async () => ({ status: "shared" })),
  polishDictionaryMarkdown: jest.fn((value) => value),
  copyTextToClipboard: jest.fn(async () => ({ status: "copied" })),
}));

jest.unstable_mockModule("@/api/words.js", () => ({
  wordCacheKey: jest.fn(({ term, language }) => `${term}-${language}`),
}));

const useWordStore = (selector) => selector(mockWordStoreState);
useWordStore.getState = () => ({
  getRecord: mockGetRecord,
  getEntry: mockGetEntry,
  setActiveVersion: mockSetActiveVersion,
});

const useSettingsStore = (selector) => selector(mockSettingsState);

jest.unstable_mockModule("@/store", () => ({
  useWordStore,
  useSettingsStore,
}));

jest.unstable_mockModule("@/config", () => ({
  DEFAULT_MODEL: "test-model",
  REPORT_FORM_URL: "",
  SUPPORT_EMAIL: "",
}));

const { useDictionaryExperience } = await import(
  "./useDictionaryExperience.js"
);

beforeEach(() => {
  jest.clearAllMocks();
  mockHistoryApi.history = [];
  mockSettingsState.dictionarySourceLanguage = "AUTO";
  mockSettingsState.dictionaryTargetLanguage = "CHINESE";
  mockUserState.user = { id: "user-id" };
  mockFavoritesApi.favorites = [];
  mockStreamWord.mockImplementation(() => (async function* () {})());
  mockGetRecord.mockImplementation(() => null);
  mockGetEntry.mockImplementation(() => null);
  mockWordStoreState.entries = {};
});

describe("useDictionaryExperience", () => {
  /**
   * 测试路径：无用户登录时提交查询，需立即引导至登录页。
   * 步骤：构造空用户上下文，调用 handleSend。
   * 断言：应触发导航到 /login，且不会调用历史写入。
   */
  it("redirects to login when submitting without an authenticated user", async () => {
    mockUserState.user = null;
    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(mockHistoryApi.addHistory).not.toHaveBeenCalled();
  });

  /**
   * 测试路径：切换收藏面板时，侧栏视图状态应同步更新。
   * 步骤：依次调用 handleShowFavorites 与 handleShowDictionary。
   * 断言：activeSidebarView 从 favorites 变更为 dictionary。
   */
  it("updates sidebar view state when toggling favorites", () => {
    const { result } = renderHook(() => useDictionaryExperience());

    act(() => {
      result.current.handleShowFavorites();
    });
    expect(result.current.activeSidebarView).toBe("favorites");

    act(() => {
      result.current.handleShowDictionary();
    });
    expect(result.current.activeSidebarView).toBe("dictionary");
  });

  /**
   * 测试路径：当缓存存在时再次提交相同查询，应直接渲染缓存并避免流式请求。
   * 步骤：预置缓存记录，调用 handleSend 提交相同查询。
   * 断言：streamWord 未被调用，界面状态立即指向缓存词条，loading 与 isRefreshing 均为 false。
   */
  it("renders cached record immediately without triggering a new stream", async () => {
    const cachedEntry = {
      id: "v1",
      versionId: "v1",
      term: "hello",
      markdown: "cached definition",
      flavor: "default",
    };
    const cachedRecord = {
      versions: [cachedEntry],
      activeVersionId: "v1",
      metadata: { flavor: "default" },
    };
    mockGetRecord.mockImplementation(() => cachedRecord);
    mockGetEntry.mockImplementation(() => cachedEntry);
    mockWordStoreState.entries = { "hello-ENGLISH": cachedRecord };
    mockStreamWord.mockClear();

    const { result } = renderHook(() => useDictionaryExperience());

    act(() => {
      result.current.setText("hello");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockStreamWord).not.toHaveBeenCalled();
    expect(result.current.entry).toEqual(cachedEntry);
    expect(result.current.loading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
  });

  /**
   * 测试路径：缓存命中后触发重新生成，应进入刷新状态并在收到新版本时更新展示。
   * 步骤：预置缓存、执行查询、调用 handleReoutput，并在流式模拟中切换为新版本。
   * 断言：streamWord 仅调用一次，刷新状态在流程结束后关闭，最终词条被更新为新版本。
   */
  it("refreshes in background and updates when a new version is available", async () => {
    const cachedEntry = {
      id: "v1",
      versionId: "v1",
      term: "hello",
      markdown: "cached definition",
      flavor: "default",
    };
    const refreshedEntry = {
      id: "v2",
      versionId: "v2",
      term: "hello",
      markdown: "refreshed definition",
      flavor: "default",
    };
    const cachedRecord = {
      versions: [cachedEntry],
      activeVersionId: "v1",
      metadata: { flavor: "default" },
    };
    let recordRef = cachedRecord;
    mockGetRecord.mockImplementation(() => recordRef);
    mockGetEntry.mockImplementation(() => recordRef.versions[0]);
    mockWordStoreState.entries = { "hello-ENGLISH": cachedRecord };
    mockStreamWord.mockClear();

    const { result } = renderHook(() => useDictionaryExperience());

    act(() => {
      result.current.setText("hello");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockStreamWord).not.toHaveBeenCalled();
    expect(result.current.entry).toEqual(cachedEntry);

    const refreshedRecord = {
      versions: [refreshedEntry],
      activeVersionId: "v2",
      metadata: { flavor: "default" },
    };

    mockStreamWord.mockImplementation(() =>
      (async function* () {
        recordRef = refreshedRecord;
        yield { chunk: JSON.stringify(refreshedEntry), language: "ENGLISH" };
        await new Promise((resolve) => setTimeout(resolve, 0));
      })(),
    );

    await act(async () => {
      result.current.dictionaryActionBarProps.onReoutput();
    });

    await waitFor(() => expect(result.current.isRefreshing).toBe(true));

    await waitFor(() => expect(mockStreamWord).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    expect(result.current.entry).toEqual(refreshedEntry);
  });
});
