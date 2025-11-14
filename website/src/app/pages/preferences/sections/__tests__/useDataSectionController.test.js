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

const runActionImmediately = (_actionId, action) => {
  const result = action();
  return result instanceof Promise ? result : Promise.resolve(result);
};

const createAsyncMock = () =>
  jest.fn(() => new Promise((resolve) => setTimeout(resolve, 0)));

const createGovernanceState = () => ({
  historyCaptureEnabled: true,
  retentionPolicyId: "30d",
  setHistoryCaptureEnabled: jest.fn(),
  setRetentionPolicy: jest.fn(),
});

const createHistoryState = () => ({
  history: [
    { language: "english", termKey: "t-1" },
    { language: "de", termKey: "t-2" },
  ],
  clearHistory: createAsyncMock(),
  clearHistoryByLanguage: createAsyncMock(),
  applyRetentionPolicy: createAsyncMock(),
});

const configureSelectors = ({ governanceState, historyState }) => {
  mockUseDataGovernanceStore.mockImplementation((selector) =>
    selector(governanceState),
  );
  mockUseHistoryStore.mockImplementation((selector) =>
    selector(historyState),
  );
};

const configureContext = ({ translations, user }) => {
  mockUseLanguage.mockReturnValue({ t: translations });
  mockUseUser.mockReturnValue({ user });
};

const configureWordStore = () => {
  mockUseWordStoreGetState.mockReturnValue({
    getEntry: jest.fn(),
  });
};

const configureRetentionLookup = () => {
  mockGetRetentionPolicyById.mockImplementation((policyId) =>
    policyId === "30d" ? { id: "30d", days: 30 } : null,
  );
};

const ensureUrlApis = () => {
  global.URL.createObjectURL =
    global.URL.createObjectURL ?? jest.fn(() => "blob:mock");
  global.URL.revokeObjectURL = global.URL.revokeObjectURL ?? jest.fn();
};

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

const initializeSuiteLifecycle = () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsActionPending.mockReturnValue(false);
    mockRunWithPending.mockImplementation(runActionImmediately);

    governanceState = createGovernanceState();
    historyState = createHistoryState();
    user = { id: "user-1" };

    configureContext({ translations, user });
    configureSelectors({ governanceState, historyState });
    configureWordStore();
    configureRetentionLookup();
    ensureUrlApis();
  });
};

const renderController = (props = {}) =>
  renderHook(() => useDataSectionController({ message: "", descriptionId: "desc", ...props }));

const registerControllerTests = () => {
  it("Given store snapshots when controller renders then exposes structured controls", () => {
    const { result } = renderController();

    expect(result.current.copy.actions.label).toBe("Data actions");
    expect(result.current.ids.toggle).toBeTruthy();
    expect(result.current.historyToggle.value).toBe(true);
    expect(result.current.actionsControl.canClearAll).toBe(true);
  });

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

  it("Given clear all command when executed then removes history via pending workflow", async () => {
    const { result } = renderController();

    await act(() => result.current.actionsControl.onClearAll());

    expect(mockRunWithPending).toHaveBeenCalledWith(
      ACTION_CLEAR_ALL,
      expect.any(Function),
    );
    expect(historyState.clearHistory).toHaveBeenCalledWith(user);
  });

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
};

beforeAll(async () => {
  ({ useDataSectionController } = await import(
    "../useDataSectionController.js"
  ));
  ({ ACTION_CLEAR_ALL, ACTION_CLEAR_LANGUAGE, ACTION_RETENTION } = await import(
    "../dataSectionActions.js"
  ));
});

describe("useDataSectionController", () => {
  initializeSuiteLifecycle();
  registerControllerTests();
});
