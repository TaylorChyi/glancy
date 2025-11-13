import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

const mockUseLanguage = jest.fn();
const mockUseUser = jest.fn();
const mockUseTheme = jest.fn();
const mockUseKeyboardShortcutContext = jest.fn();
const mockUseDataGovernanceStore = jest.fn();
const mockUseHistoryStore = jest.fn();
const mockGetRetentionPolicyById = jest.fn();
const mockUseWordStoreGetState = jest.fn();
const mockRunWithPending = jest.fn();
const mockIsActionPending = jest.fn(() => false);

const buildGovernanceModule = () => ({
  __esModule: true,
  useDataGovernanceStore: mockUseDataGovernanceStore,
  DATA_RETENTION_POLICIES: [
    { id: "30d", days: 30 },
    { id: "forever", days: null },
  ],
  getRetentionPolicyById: mockGetRetentionPolicyById,
});

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: mockUseLanguage,
  useUser: mockUseUser,
  useTheme: mockUseTheme,
  useKeyboardShortcutContext: mockUseKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
}));

jest.unstable_mockModule(
  "@core/store/dataGovernanceStore.ts",
  buildGovernanceModule,
);
jest.unstable_mockModule(
  "@core/store/dataGovernanceStore",
  buildGovernanceModule,
);

jest.unstable_mockModule("@core/store/historyStore.ts", () => ({
  useHistoryStore: mockUseHistoryStore,
}));

jest.unstable_mockModule("@core/store/wordStore.js", () => ({
  useWordStore: { getState: mockUseWordStoreGetState },
}));

jest.unstable_mockModule("../usePendingAction.js", () => ({
  usePendingAction: () => ({
    runWithPending: mockRunWithPending,
    isActionPending: mockIsActionPending,
  }),
}));

let useDataSectionController;
let ACTION_CLEAR_ALL;
let ACTION_CLEAR_LANGUAGE;
let ACTION_RETENTION;

beforeAll(async () => {
  ({ useDataSectionController } = await import(
    "../useDataSectionController.js"
  ));
  ({ ACTION_CLEAR_ALL, ACTION_CLEAR_LANGUAGE, ACTION_RETENTION } = await import(
    "../dataSectionActions.js"
  ));
});

describe("useDataSectionController", () => {
  const translations = {
    settingsDataHistoryToggleLabel: "Capture history",
    settingsDataHistoryToggleDescription: "Toggle history capture",
    settingsDataHistoryToggleOn: "On",
    settingsDataHistoryToggleOff: "Off",
    settingsDataRetentionLabel: "Retention window",
    settingsDataRetentionDescription: "Pick retention",
    settingsDataLanguageLabel: "Language history",
    settingsDataLanguageDescription: "Select language",
    settingsDataClearLanguagePlaceholder: "No language",
    settingsDataActionsLabel: "Data actions",
    settingsDataClearAll: "Clear all",
    settingsDataClearLanguage: "Clear language",
    settingsDataExport: "Export",
    settingsDataExportDescription: "Export description",
    settingsDataExportFileName: "glancy-data",
    dictionaryTargetLanguageEnglish: "Bravo",
  };

  let governanceState;
  let historyState;
  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsActionPending.mockReturnValue(false);
    mockRunWithPending.mockImplementation((_actionId, action) => {
      const result = action();
      return result instanceof Promise ? result : Promise.resolve(result);
    });

    governanceState = {
      historyCaptureEnabled: true,
      retentionPolicyId: "30d",
      setHistoryCaptureEnabled: jest.fn(),
      setRetentionPolicy: jest.fn(),
    };

    historyState = {
      history: [
        { language: "english", termKey: "t-1" },
        { language: "de", termKey: "t-2" },
      ],
      clearHistory: jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 0)),
      ),
      clearHistoryByLanguage: jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 0)),
      ),
      applyRetentionPolicy: jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 0)),
      ),
    };

    user = { id: "user-1" };

    mockUseLanguage.mockReturnValue({ t: translations });
    mockUseUser.mockReturnValue({ user });
    mockUseDataGovernanceStore.mockImplementation((selector) =>
      selector(governanceState),
    );
    mockUseHistoryStore.mockImplementation((selector) =>
      selector(historyState),
    );
    mockUseWordStoreGetState.mockReturnValue({
      getEntry: jest.fn(),
    });
    mockGetRetentionPolicyById.mockImplementation((policyId) =>
      policyId === "30d" ? { id: "30d", days: 30 } : null,
    );

    // jsdom 提供 URL API；若执行环境缺失可在此补充 polyfill。
    global.URL.createObjectURL =
      global.URL.createObjectURL ?? jest.fn(() => "blob:mock");
    global.URL.revokeObjectURL = global.URL.revokeObjectURL ?? jest.fn();
  });

  const renderController = (props = {}) =>
    renderHook(() => useDataSectionController({ message: "", descriptionId: "desc", ...props }));

  /**
   * 测试目标：验证控制器输出的基础字段与控制对象结构。
   * 前置条件：提供含历史记录的 store 与翻译上下文。
   * 步骤：
   *  1) 渲染 Hook；
   *  2) 读取 copy、ids 与控制对象。
   * 断言：
   *  - copy 按照翻译构建；
   *  - 控制对象带有预期属性；
   *  - canClearAll 根据历史条目计算。
   * 边界/异常：
   *  - ids 应为稳定字符串且存在多个字段。
   */
  it("Given store snapshots when controller renders then exposes structured controls", () => {
    const { result } = renderController();

    expect(result.current.copy.actions.label).toBe("Data actions");
    expect(result.current.ids.toggle).toBeTruthy();
    expect(result.current.historyToggle.value).toBe(true);
    expect(result.current.actionsControl.canClearAll).toBe(true);
  });

  /**
   * 测试目标：验证保留策略更新会触发治理 store 与历史 store，并通过 pending 包装执行。
   * 前置条件：提供可解析的策略与用户上下文。
   * 步骤：调用 retentionControl.onChange。
   * 断言：
   *  - setRetentionPolicy 接收策略 id；
   *  - runWithPending 以 ACTION_RETENTION 包装调用；
   *  - applyRetentionPolicy 接收策略天数与用户。
   */
  it("Given retention control when policy changes then synchronizes stores", async () => {
    const { result } = renderController();

    await act(() => result.current.retentionControl.onChange("30d"));

    expect(governanceState.setRetentionPolicy).toHaveBeenCalledWith("30d");
    expect(mockRunWithPending).toHaveBeenCalledWith(
      ACTION_RETENTION,
      expect.any(Function),
    );
    expect(historyState.applyRetentionPolicy).toHaveBeenCalledWith(30, user);
  });

  /**
   * 测试目标：验证清空历史操作会通过 pending 包装触发 clearHistory。
   * 前置条件：用户上下文存在。
   * 步骤：调用 actionsControl.onClearAll。
   * 断言：runWithPending 使用 ACTION_CLEAR_ALL，clearHistory 接收用户。
   */
  it("Given clear all command when executed then removes history via pending workflow", async () => {
    const { result } = renderController();

    await act(() => result.current.actionsControl.onClearAll());

    expect(mockRunWithPending).toHaveBeenCalledWith(
      ACTION_CLEAR_ALL,
      expect.any(Function),
    );
    expect(historyState.clearHistory).toHaveBeenCalledWith(user);
  });

  /**
   * 测试目标：验证按语言清空操作会归一化语言并调用 clearHistoryByLanguage。
   * 前置条件：历史记录含有不同语言。
   * 步骤：调用 languageControl.onClear。
   * 断言：runWithPending 使用 ACTION_CLEAR_LANGUAGE，且传入 ENGLISH 与用户。
   */
  it("Given scoped clear action when executed then normalizes language and clears history", async () => {
    const { result } = renderController();

    await act(() => result.current.languageControl.onClear());

    expect(mockRunWithPending).toHaveBeenCalledWith(
      ACTION_CLEAR_LANGUAGE,
      expect.any(Function),
    );
    expect(historyState.clearHistoryByLanguage).toHaveBeenCalledWith(
      "ENGLISH",
      user,
    );
  });
});
