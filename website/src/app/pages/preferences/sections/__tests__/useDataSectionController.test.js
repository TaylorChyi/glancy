/**
 * 背景：
 *  - useDataSectionController 负责协调多模块数据，必须通过测试验证 orchestrator 行为。
 * 目的：
 *  - 模拟 Store 与上下文依赖，确保控制器输出的控制对象与 pending 管理符合预期。
 * 关键决策与取舍：
 *  - 采用模块级 mock 隔离外部副作用，仅聚焦组合逻辑；
 *  - 通过 renderHook 驱动交互，验证回调链路正确触发。
 * 影响范围：
 *  - 偏好设置数据分区的整体交互流。
 */
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
    const { result } = renderHook(() =>
      useDataSectionController({ message: "", descriptionId: "desc" }),
    );

    expect(result.current.copy.actions.label).toBe("Data actions");
    expect(result.current.ids.toggle).toBeTruthy();
    expect(result.current.historyToggle.value).toBe(true);
    expect(result.current.actionsControl.canClearAll).toBe(true);
  });

  /**
   * 测试目标：验证保留策略与清理动作会触发对应 store 方法并维护 pending 状态。
   * 前置条件：提供可解析的策略、历史操作与用户上下文。
   * 步骤：
   *  1) 调用 retentionControl.onChange 并等待完成；
   *  2) 调用 actionsControl.onClearAll 并观察 pending 标记；
   *  3) 调用 languageControl.onClear 并确保语言被归一化。
   * 断言：
   *  - setRetentionPolicy 与 applyRetentionPolicy 均按顺序执行；
   *  - 清理动作期间 isActionPending 返回 true，结束后恢复；
   *  - clearHistory 与 clearHistoryByLanguage 传入用户及归一化语言。
   * 边界/异常：
   *  - 遇到无效策略 id 时不会抛出异常（通过 mock 返回 null 覆盖）。
   */
  it("Given control interactions when executed then drives stores and pending lifecycle", async () => {
    mockGetRetentionPolicyById.mockImplementation((policyId) =>
      policyId === "30d" ? { id: "30d", days: 30 } : null,
    );

    const { result } = renderHook(() =>
      useDataSectionController({ message: "", descriptionId: "desc" }),
    );

    await act(async () => {
      await result.current.retentionControl.onChange("30d");
    });

    expect(governanceState.setRetentionPolicy).toHaveBeenCalledWith("30d");
    const retentionCall = mockRunWithPending.mock.calls.find(
      ([actionId]) => actionId === ACTION_RETENTION,
    );
    expect(retentionCall).toBeDefined();
    await retentionCall[1]();
    expect(historyState.applyRetentionPolicy).toHaveBeenCalledWith(30, user);

    await act(async () => {
      await result.current.actionsControl.onClearAll();
    });

    const clearAllCall = mockRunWithPending.mock.calls.find(
      ([actionId]) => actionId === ACTION_CLEAR_ALL,
    );
    expect(clearAllCall).toBeDefined();
    await clearAllCall[1]();
    expect(historyState.clearHistory).toHaveBeenCalledWith(user);

    await act(async () => {
      await result.current.languageControl.onClear();
    });

    const clearLanguageCall = mockRunWithPending.mock.calls.find(
      ([actionId]) => actionId === ACTION_CLEAR_LANGUAGE,
    );
    expect(clearLanguageCall).toBeDefined();
    await clearLanguageCall[1]();
    expect(historyState.clearHistoryByLanguage).toHaveBeenCalledWith(
      "ENGLISH",
      user,
    );
  });
});
