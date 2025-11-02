/**
 * 背景：
 *  - useDictionaryExperience 相关测试需要大量上下文 mock，原有文件集中编写导致超长且难以维护。
 * 目的：
 *  - 提供可复用的测试装配工具，统一构造 React Router、store、API 等依赖的替身实现。
 * 关键决策与取舍：
 *  - 采用集中式 harness 暴露 mock 与复位函数，避免重复配置并支撑按领域拆分的测试文件；
 *  - 保留 jest.unstable_mockModule 与顶层 await，确保在导入被测 hook 前完成依赖替换。
 * 影响范围：
 *  - 所有 useDictionaryExperience 相关测试文件共享同一组 mock 与生命周期管理。
 * 演进与TODO：
 *  - 后续可将常见断言封装为更高阶的 DSL，进一步提升可读性。
 */
import { jest } from "@jest/globals";

export const mockNavigate = jest.fn();
export const mockHistoryApi = {
  history: [],
  loadHistory: jest.fn(),
  addHistory: jest.fn(),
  unfavoriteHistory: jest.fn(),
  removeHistory: jest.fn(),
};
export const mockUserState = { user: { id: "user-id" } };
export const mockFavoritesApi = { favorites: [], toggleFavorite: jest.fn() };
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
export const mockToggleFavoriteEntry = jest.fn();
export const mockStartSpeech = jest.fn();
export const mockStreamWord = jest.fn(() => (async function* () {})());
export const mockGetRecord = jest.fn(() => null);
export const mockGetEntry = jest.fn(() => null);
export const mockSetActiveVersion = jest.fn();
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
  useFavorites: () => mockFavoritesApi,
  useTheme: () => mockThemeApi,
  useLanguage: () => mockLanguageApi,
}));

jest.unstable_mockModule("@shared/hooks", () => ({
  useStreamWord: () => mockStreamWord,
  useSpeechInput: () => ({ start: mockStartSpeech }),
  useAppShortcuts: () => ({ toggleFavoriteEntry: mockToggleFavoriteEntry }),
}));

jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: () => ({ wordReports: { submitWordReport: submitWordReportMock } }),
}));

jest.unstable_mockModule("@shared/utils", () => ({
  extractMarkdownPreview: jest.fn(() => null),
  resolveDictionaryConfig: jest.fn(() => ({
    language: "ENGLISH",
    flavor: "default",
  })),
  resolveDictionaryFlavor: jest.fn(() => "default"),
  WORD_LANGUAGE_AUTO: "AUTO",
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
  setActiveVersion: mockSetActiveVersion,
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

/**
 * 意图：根据给定片段快速构造异步生成器，简化测试中的嵌套回调。
 * 输入：chunks 为按顺序输出的响应片段。
 * 输出：返回立即可用的异步迭代器实例。
 * 流程：逐个 yield 传入片段，不做额外处理。
 * 错误处理：依赖调用方保证片段结构合法。
 * 复杂度：O(n)，n 为片段数量。
 */
export const createStreamFromChunks = (...chunks) =>
  (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();

export const resetDictionaryExperienceTestState = () => {
  jest.clearAllMocks();
  mockHistoryApi.history = [];
  mockSettingsState.dictionarySourceLanguage = "AUTO";
  mockSettingsState.dictionaryTargetLanguage = "CHINESE";
  mockUserState.user = { id: "user-id" };
  mockFavoritesApi.favorites = [];
  mockStreamWord.mockImplementation(() => (async function* () {})());
  mockGetRecord.mockImplementation(() => null);
  mockGetEntry.mockImplementation(() => null);
  utilsModule.extractMarkdownPreview.mockImplementation(() => null);
  utilsModule.polishDictionaryMarkdown.mockImplementation((value) => value);
  useDataGovernanceStore.setState({ historyCaptureEnabled: true });
  mockWordStoreState.entries = {};
  submitWordReportMock.mockReset();
};

export const restoreDictionaryExperienceTimers = () => {
  jest.useRealTimers();
};
