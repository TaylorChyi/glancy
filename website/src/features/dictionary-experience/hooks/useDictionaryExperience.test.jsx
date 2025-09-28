import { renderHook, act } from "@testing-library/react";
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
const mockWordStoreState = { entries: [] };

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
});
