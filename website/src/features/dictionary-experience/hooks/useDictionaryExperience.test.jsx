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
  primaryNavLibraryLabel: "致用单词",
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

const utilsModule = await import("@/utils");
const { useDictionaryExperience, COPY_FEEDBACK_STATES } = await import(
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
  utilsModule.extractMarkdownPreview.mockImplementation(() => null);
});

afterEach(() => {
  jest.useRealTimers();
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
   * 测试目标：当模型返回纠正后的词条时，历史写入应以纠正词条为准。
   * 前置条件：mockStreamWord 产出 term 为 "student" 的词条数据，用户输入 "studdent"。
   * 步骤：
   *  1) 设置输入框文本为 "studdent"；
   *  2) 调用 handleSend 触发查询流程；
   * 断言：
   *  - addHistory 首个参数为 "student"；
   *  - addHistory 仅被调用一次。
   * 边界/异常：
   *  - 若模型未返回 term，应退回原始输入（此用例不覆盖）。
   */
  it("writes corrected term into history when lookup normalizes input", async () => {
    const correctedEntry = { term: "student", markdown: "definition" };
    mockStreamWord.mockImplementation(
      () =>
        (async function* () {
          yield { chunk: JSON.stringify(correctedEntry), language: "ENGLISH" };
        })(),
    );

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("studdent");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockHistoryApi.addHistory).toHaveBeenCalledTimes(1);
    expect(mockHistoryApi.addHistory.mock.calls[0][0]).toBe("student");
  });

  /**
   * 测试路径：查询过程中卸载组件，需调用 AbortController.abort 并避免卸载后 setState。
   * 步骤：启动查询但不等待结束，随后立即卸载 Hook。
   * 断言：AbortController.abort 被调用一次，且控制台无卸载后更新的警告。
   */
  it("aborts in-flight lookups on unmount to avoid stale state updates", async () => {
    const originalAbortController = global.AbortController;
    const abortSpy = jest.fn();
    const abortError = Object.assign(new Error("Aborted"), {
      name: "AbortError",
    });

    class MockAbortController {
      constructor() {
        this.listeners = new Set();
        this.signal = {
          aborted: false,
          addEventListener: (event, handler) => {
            if (event === "abort") {
              this.listeners.add(handler);
            }
          },
          removeEventListener: (event, handler) => {
            if (event === "abort") {
              this.listeners.delete(handler);
            }
          },
        };
      }

      abort() {
        if (this.signal.aborted) {
          return;
        }
        this.signal.aborted = true;
        abortSpy();
        for (const listener of this.listeners) {
          listener();
        }
      }
    }

    global.AbortController = MockAbortController;

    mockStreamWord.mockImplementationOnce(({ signal }) =>
      (async function* () {
        await new Promise((resolve, reject) => {
          if (signal.aborted) {
            reject(abortError);
            return;
          }
          const handleAbort = () => {
            signal.removeEventListener?.("abort", handleAbort);
            reject(abortError);
          };
          signal.addEventListener?.("abort", handleAbort);
        });
        yield* [];
      })(),
    );

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useDictionaryExperience());

    try {
      await act(async () => {
        result.current.setText("delayed term");
      });

      let pendingSend;
      await act(async () => {
        pendingSend = result.current.handleSend({
          preventDefault: jest.fn(),
        });
        await Promise.resolve();
      });

      expect(mockStreamWord).toHaveBeenCalledTimes(1);
      expect(abortSpy).not.toHaveBeenCalled();

      act(() => {
        unmount();
      });

      expect(abortSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await pendingSend;
      });

      const hasUnmountWarning = consoleErrorSpy.mock.calls.some(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes(
            "Can't perform a React state update on an unmounted component.",
          ),
      );
      expect(hasUnmountWarning).toBe(false);
    } finally {
      consoleErrorSpy.mockRestore();
      global.AbortController = originalAbortController;
    }
  });

  /**
   * 测试目标：复制成功后状态机应进入 success，并在延迟后恢复 idle；
   * 同时不再弹出成功提示，避免重复反馈。
   * 前置条件：mockStreamWord 返回含 markdown 的词条，clipboard 写入成功。
   * 步骤：
   *  1) 通过 handleSend 拉取词条；
   *  2) 调用工具栏 onCopy；
   *  3) 推进计时器 2 秒等待复位。
   * 断言：
   *  - copyTextToClipboard 被调用一次；
   *  - popupOpen 保持 false，popupMsg 为空字符串；
   *  - copyFeedbackState 由 success 退回 idle，isCopySuccess 相应更新。
   * 边界/异常：
   *  - 若定时器未清理，状态将停留在 success 触发断言失败。
   */
  it("GivenSuccessfulCopy_WhenCopyInvoked_ThenShowsSuccessAndResets", async () => {
    jest.useFakeTimers();

    const entry = {
      id: "v-copy",
      term: "delta",
      markdown: "## Meaning",
    };
    const record = {
      versions: [entry],
      activeVersionId: entry.id,
    };
    mockGetRecord.mockReturnValue(record);
    mockGetEntry.mockImplementation(() => entry);
    mockStreamWord.mockImplementation(() =>
      (async function* () {
        yield { chunk: JSON.stringify(entry), language: "ENGLISH" };
      })(),
    );

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText(entry.term);
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(result.current.dictionaryActionBarProps.canCopy).toBe(true);

    await act(async () => {
      await result.current.dictionaryActionBarProps.onCopy();
    });

    expect(utilsModule.copyTextToClipboard).toHaveBeenCalledTimes(1);
    expect(result.current.dictionaryActionBarProps.copyFeedbackState).toBe(
      COPY_FEEDBACK_STATES.SUCCESS,
    );
    expect(result.current.dictionaryActionBarProps.isCopySuccess).toBe(true);
    expect(result.current.popupOpen).toBe(false);
    expect(result.current.popupMsg).toBe("");

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.dictionaryActionBarProps.copyFeedbackState).toBe(
      COPY_FEEDBACK_STATES.IDLE,
    );
    expect(result.current.dictionaryActionBarProps.isCopySuccess).toBe(false);
  });

  /**
   * 测试目标：当复制内容为空时，状态机保持 idle 并避免触发 clipboard 写入。
   * 前置条件：未加载任何词条内容，copyPayload 为空字符串。
   * 步骤：
   *  1) 直接调用工具栏 onCopy；
   * 断言：
   *  - copyTextToClipboard 不会被调用；
   *  - copyFeedbackState 与 isCopySuccess 维持初始值。
   * 边界/异常：
   *  - 若误判可复制导致调用 clipboard，将触发断言失败。
   */
  it("GivenEmptyClipboardPayload_WhenCopyInvoked_ThenStaysIdle", async () => {
    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      await result.current.dictionaryActionBarProps.onCopy();
    });

    expect(utilsModule.copyTextToClipboard).not.toHaveBeenCalled();
    expect(result.current.dictionaryActionBarProps.copyFeedbackState).toBe(
      COPY_FEEDBACK_STATES.IDLE,
    );
    expect(result.current.dictionaryActionBarProps.isCopySuccess).toBe(false);
  });

  /**
   * 测试目标：复制出现异常时需立即回退至 idle，避免卡在成功态。
   * 前置条件：clipboard 写入抛出异常，已有词条可复制。
   * 步骤：
   *  1) 构造词条并触发 onCopy；
   * 断言：
   *  - copyFeedbackState 仍为 idle；
   *  - isCopySuccess 为 false。
   * 边界/异常：
   *  - 若异常分支未处理，状态将残留导致断言失败。
   */
  it("GivenClipboardFailure_WhenCopyInvoked_ThenResetsToIdle", async () => {
    jest.useFakeTimers();

    const entry = {
      id: "v-error",
      term: "epsilon",
      markdown: "## Alt",
    };
    const record = {
      versions: [entry],
      activeVersionId: entry.id,
    };
    utilsModule.copyTextToClipboard.mockRejectedValueOnce(
      new Error("clipboard failed"),
    );
    mockGetRecord.mockReturnValue(record);
    mockGetEntry.mockImplementation(() => entry);
    mockStreamWord.mockImplementation(() =>
      (async function* () {
        yield { chunk: JSON.stringify(entry), language: "ENGLISH" };
      })(),
    );

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText(entry.term);
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    await act(async () => {
      await result.current.dictionaryActionBarProps.onCopy();
    });

    expect(utilsModule.copyTextToClipboard).toHaveBeenCalledTimes(1);
    expect(result.current.dictionaryActionBarProps.copyFeedbackState).toBe(
      COPY_FEEDBACK_STATES.IDLE,
    );
    expect(result.current.dictionaryActionBarProps.isCopySuccess).toBe(false);
  });

  /**
   * 测试路径：切换致用单词视图时，activeView 需同步更新。
   * 步骤：依次调用 handleShowLibrary 与 handleShowDictionary。
   * 断言：activeView 从 library 变更为 dictionary 且 viewState 标志同步。
   */
  it("updates active view when toggling library", () => {
    const { result } = renderHook(() => useDictionaryExperience());

    act(() => {
      result.current.handleShowLibrary();
    });
    expect(result.current.activeView).toBe("library");
    expect(result.current.viewState.isLibrary).toBe(true);
    expect(result.current.viewState.isDictionary).toBe(false);

    act(() => {
      result.current.handleShowDictionary();
    });
    expect(result.current.activeView).toBe("dictionary");
    expect(result.current.viewState.isDictionary).toBe(true);
    expect(result.current.viewState.isLibrary).toBe(false);
  });

  /**
   * 测试目标：handleShowDictionary 需在存在释义内容时恢复空白首页。
   * 前置条件：mockStreamWord 返回有效 JSON，词条记录命中缓存版本。
   * 步骤：
   *  1) 通过 setText 与 handleSend 触发查询并生成版本数据；
   *  2) 调用 handleShowDictionary 重置视图。
   * 断言：
   *  - entry/finalText/streamText 归空；
   *  - dictionaryActionBarProps.versions 清空且 activeVersionId 置空；
   *  - activeSidebarView 恢复为 dictionary，loading 为 false。
   * 边界/异常：
   *  - 若取消查询逻辑未清理 loading，应导致断言失败提示状态未复位。
   */
  it("GivenDefinitionState_WhenHandleShowDictionary_ThenResetsToHome", async () => {
    utilsModule.extractMarkdownPreview.mockImplementation(
      () => "Preview snippet",
    );

    const record = {
      versions: [
        {
          id: "v1",
          markdown: "## Meaning",
          term: "alpha",
        },
      ],
      activeVersionId: "v1",
    };
    mockGetRecord.mockReturnValue(record);
    mockGetEntry.mockImplementation(() => record.versions[0]);
    mockStreamWord.mockImplementation(() =>
      (async function* () {
        yield {
          chunk: JSON.stringify(record.versions[0]),
          language: "ENGLISH",
        };
      })(),
    );

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("alpha");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(result.current.entry).not.toBeNull();
    expect(result.current.finalText).toBe("## Meaning");
    expect(result.current.streamText).toBe("Preview snippet");
    expect(result.current.dictionaryActionBarProps.versions).toHaveLength(1);
    expect(result.current.dictionaryActionBarProps.activeVersionId).toBe("v1");

    act(() => {
      result.current.handleShowDictionary();
    });

    expect(result.current.entry).toBeNull();
    expect(result.current.finalText).toBe("");
    expect(result.current.streamText).toBe("");
    expect(result.current.dictionaryActionBarProps.versions).toHaveLength(0);
    expect(result.current.dictionaryActionBarProps.activeVersionId).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.activeView).toBe("dictionary");
    expect(result.current.viewState.isDictionary).toBe(true);
  });
});
