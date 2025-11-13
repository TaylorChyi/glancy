import { jest } from "@jest/globals";

export const mockNavigate = jest.fn();
export const mockHistoryApi = {
  history: [],
  loadHistory: jest.fn(),
  addHistory: jest.fn(),
  removeHistory: jest.fn(),
};
export const mockUserState = { user: { id: "user-id" } };
export const mockThemeApi = { theme: "light", setTheme: jest.fn() };

export const translationFixture = {
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
  searchEmptyTitle: "开始探索",
  searchEmptyDescription: "输入任何词汇即可获取解释",
  inputPlaceholder: "输入查询内容",
  copyAction: "复制",
  copySuccess: "复制成功",
  copyEmpty: "无内容",
  copyFailed: "复制失败",
  copyUnavailable: "不可复制",
  reportUnavailable: "无法报告",
  reportFailed: "报告失败",
  report: "报告",
  reportSuccess: "报告成功",
  primaryNavLibraryLabel: "致用单词",
};

export const mockLanguageApi = {
  t: translationFixture,
  lang: "en",
  setLang: jest.fn(),
};
export const mockGetRecord = jest.fn(() => null);
export const mockGetEntry = jest.fn(() => null);
export const mockFetchWordWithHandling = jest.fn(async () => ({
  data: null,
  error: null,
  language: "ENGLISH",
  flavor: "default",
}));
export const mockSettingsState = {
  dictionarySourceLanguage: "AUTO",
  dictionaryTargetLanguage: "CHINESE",
  setDictionarySourceLanguage: jest.fn(),
  setDictionaryTargetLanguage: jest.fn(),
};
export const mockWordStoreState = { entries: [] };

export const submitWordReportMock = jest.fn();

jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.unstable_mockModule("@core/context", () => ({
  useHistory: () => mockHistoryApi,
  useUser: () => mockUserState,
  useTheme: () => mockThemeApi,
  useLanguage: () => mockLanguageApi,
  useFavorites: () => ({ favorites: [], addFavorite: jest.fn(), removeFavorite: jest.fn() }),
}));

jest.unstable_mockModule("@shared/hooks", () => ({
  useFetchWord: () => ({ fetchWordWithHandling: mockFetchWordWithHandling }),
  useAppShortcuts: () => ({}),
}));

jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: () => ({
    words: {
      fetchWord: async (...args) => {
        const result = await mockFetchWordWithHandling(...args);
        return result && typeof result === "object" && "data" in result
          ? result.data
          : result;
      },
    },
    wordReports: { submitWordReport: submitWordReportMock },
  }),
}));

jest.unstable_mockModule("@shared/utils", () => ({
  extractMarkdownPreview: jest.fn(() => null),
  resolveDictionaryConfig: jest.fn(() => ({
    language: "ENGLISH",
    flavor: "default",
  })),
  resolveDictionaryFlavor: jest.fn(() => "default"),
  resolveWordLanguage: jest.fn((_term, language) => language ?? "AUTO"),
  WORD_LANGUAGE_AUTO: "AUTO",
  WORD_FLAVOR_BILINGUAL: "default",
  normalizeWordSourceLanguage: jest.fn((value) => value ?? "AUTO"),
  normalizeWordTargetLanguage: jest.fn((value) => value ?? "CHINESE"),
  polishDictionaryMarkdown: jest.fn((value) => value),
  copyTextToClipboard: jest.fn(async () => ({ status: "copied" })),
}));

jest.unstable_mockModule("@shared/api/words.js", () => ({
  wordCacheKey: jest.fn(({ term, language }) => `${term}-${language}`),
}));

const useWordStore = (selector) => selector(mockWordStoreState);
useWordStore.getState = () => ({
  getRecord: mockGetRecord,
  getEntry: mockGetEntry,
});

const useSettingsStore = (selector) => selector(mockSettingsState);

const dataGovernanceState = { historyCaptureEnabled: true };
export const useDataGovernanceStore = (selector = (state) => state) =>
  selector(dataGovernanceState);
useDataGovernanceStore.getState = () => dataGovernanceState;
useDataGovernanceStore.setState = (updater) => {
  const partial =
    typeof updater === "function" ? updater(dataGovernanceState) : updater;
  if (!partial || typeof partial !== "object") {
    return;
  }
  Object.assign(dataGovernanceState, partial);
};

jest.unstable_mockModule("@core/store", () => ({
  // 仅暴露 settings store 以匹配 useDictionaryLanguageConfig 的依赖，其他 store 由具体模块 mock。
  useSettingsStore,
}));

jest.unstable_mockModule("@core/store/wordStore.js", () => ({
  __esModule: true,
  useWordStore,
}));

jest.unstable_mockModule("@core/store/dataGovernanceStore.ts", () => ({
  __esModule: true,
  useDataGovernanceStore,
}));

jest.unstable_mockModule("@core/config", () => ({
  DEFAULT_MODEL: "test-model",
}));

export const utilsModule = await import("@shared/utils");
export const { useDictionaryExperience, COPY_FEEDBACK_STATES } = await import(
  "../useDictionaryExperience.js"
);

export const resetDictionaryExperienceTestState = () => {
  jest.clearAllMocks();
  mockHistoryApi.history = [];
  mockSettingsState.dictionarySourceLanguage = "AUTO";
  mockSettingsState.dictionaryTargetLanguage = "CHINESE";
  mockUserState.user = { id: "user-id" };
  mockGetRecord.mockImplementation(() => null);
  mockGetEntry.mockImplementation(() => null);
  mockFetchWordWithHandling.mockReset();
  mockFetchWordWithHandling.mockImplementation(async () => ({
    data: null,
    error: null,
    language: "ENGLISH",
    flavor: "default",
  }));
  utilsModule.extractMarkdownPreview.mockImplementation(() => null);
  utilsModule.polishDictionaryMarkdown.mockImplementation((value) => value);
  useDataGovernanceStore.setState({ historyCaptureEnabled: true });
  mockWordStoreState.entries = {};
  submitWordReportMock.mockReset();
};

export const restoreDictionaryExperienceTimers = () => {
  jest.useRealTimers();
};
