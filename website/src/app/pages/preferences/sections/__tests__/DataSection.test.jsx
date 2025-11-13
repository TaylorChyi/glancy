import React from "react";
import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 测试同样直接引用具体 Store，保证与生产实现一致且规避 barrel 带来的循环依赖。
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useHistoryStore } from "@core/store/historyStore.ts";
import { useWordStore } from "@core/store/wordStore.js";

const translations = {
  settingsDataDescription: "Data stewardship",
  settingsDataHistoryToggleLabel: "History collection",
  settingsDataHistoryToggleDescription: "Decide if we store lookups.",
  settingsDataHistoryToggleOn: "Capture history",
  settingsDataHistoryToggleOff: "Pause history",
  settingsDataRetentionLabel: "Retention window",
  settingsDataRetentionDescription: "Keep history for",
  settingsDataRetentionOption_30d: "30 days",
  settingsDataRetentionOption_90d: "90 days",
  settingsDataRetentionOption_365d: "365 days",
  settingsDataRetentionOption_forever: "Keep forever",
  settingsDataLanguageLabel: "Language history",
  settingsDataLanguageDescription:
    "Only clears saved lookups for the selected language.",
  settingsDataClearLanguage: "Clear selected language",
  settingsDataClearLanguagePlaceholder: "No language history",
  settingsDataActionsLabel: "Data actions",
  settingsDataClearAll: "Erase all history",
  settingsDataExport: "Export data",
  settingsDataExportDescription:
    "Export detailed definitions grouped by chapter.",
  settingsDataExportFileName: "glancy-export",
  settingsDataExportDefaultChapter: "General",
  settingsDataExportChapterColumn: "chapter",
  settingsDataExportContentColumn: "content",
  definitionsLabel: "Definitions",
  dictionaryTargetLanguageEnglish: "English",
  dictionaryTargetLanguageChinese: "Chinese",
};

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: () => ({ t: translations }),
  useUser: () => ({ user: { token: "token-1" } }),
  useKeyboardShortcutContext: () => ({
    register: jest.fn(),
    unregister: jest.fn(),
  }),
  useTheme: () => ({ theme: "light" }),
  ThemeContext: {},
  ThemeProvider: ({ children }) => children,
  KEYBOARD_SHORTCUT_RESET_ACTION: "reset",
}));

jest.unstable_mockModule("@shared/components/ui/LanguageMenu", () => ({
  default: function MockLanguageMenu({
    options,
    value,
    onChange,
    id,
    ariaLabel,
  }) {
    return (
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
}));

let DataSection;
let originalClearHistory;
let originalClearHistoryByLanguage;
let originalApplyRetentionPolicy;
let originalWordStoreEntries;

const createHistoryItem = (overrides = {}) => ({
  term: "hello",
  language: "ENGLISH",
  flavor: "BILINGUAL",
  termKey: "ENGLISH:BILINGUAL:hello",
  createdAt: "2024-05-01T10:00:00Z",
  favorite: false,
  versions: [{ id: "v1", createdAt: "2024-05-01T10:00:00Z", favorite: false }],
  latestVersionId: "v1",
  ...overrides,
});

const defaultSectionProps = {
  title: "Data",
  message: "Control your data",
  headingId: "data-heading",
  descriptionId: "data-description",
};

const renderDataSection = (props = {}) =>
  render(<DataSection {...defaultSectionProps} {...props} />);

const ensureUrlSupport = (method, fallback) => {
  if (!window.URL[method]) {
    Object.defineProperty(window.URL, method, {
      configurable: true,
      writable: true,
      value: fallback,
    });
  }
};

const createBlobSpy = () => {
  const OriginalBlob = Blob;
  const calls = [];
  const spy = jest
    .spyOn(globalThis, "Blob")
    .mockImplementation((parts = [], options) => {
      calls.push({ parts, options });
      return Reflect.construct(OriginalBlob, [parts, options]);
    });
  return {
    calls,
    restore: () => spy.mockRestore(),
  };
};

const setupExportSpies = () => {
  ensureUrlSupport("createObjectURL", () => "");
  ensureUrlSupport("revokeObjectURL", () => undefined);
  const createUrl = jest
    .spyOn(window.URL, "createObjectURL")
    .mockReturnValue("blob:export");
  const revokeUrl = jest.spyOn(window.URL, "revokeObjectURL");
  const appendSpy = jest.spyOn(document.body, "appendChild");
  const removeSpy = jest.spyOn(Element.prototype, "remove");
  const { calls: blobCalls, restore } = createBlobSpy();
  return {
    createUrl,
    revokeUrl,
    appendSpy,
    removeSpy,
    blobCalls,
    restore: () => {
      createUrl.mockRestore();
      revokeUrl.mockRestore();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
      restore();
    },
  };
};

const extractCsvText = (blobCalls) =>
  (blobCalls[0]?.parts ?? [])
    .map((part) => (typeof part === "string" ? part : ""))
    .join("");

beforeAll(async () => {
  ({ default: DataSection } = await import("../DataSection.jsx"));
});

beforeEach(() => {
  originalClearHistory = useHistoryStore.getState().clearHistory;
  originalClearHistoryByLanguage =
    useHistoryStore.getState().clearHistoryByLanguage;
  originalApplyRetentionPolicy =
    useHistoryStore.getState().applyRetentionPolicy;
  useDataGovernanceStore.setState({
    historyCaptureEnabled: true,
    retentionPolicyId: "90d",
  });
  useHistoryStore.setState({
    history: [createHistoryItem()],
    clearHistory: jest.fn().mockResolvedValue(undefined),
    clearHistoryByLanguage: jest.fn().mockResolvedValue(undefined),
    applyRetentionPolicy: jest.fn().mockResolvedValue(undefined),
  });
  originalWordStoreEntries = useWordStore
    .getState()
    .getRecord("ENGLISH:BILINGUAL:hello");
  useWordStore.getState().clear();
  useWordStore.getState().setVersions(
    "ENGLISH:BILINGUAL:hello",
    [
      {
        id: "v1",
        sections: [
          { heading: "Overview", lines: ["UK /həˈləʊ/"] },
          { heading: "Definitions", lines: ["A friendly greeting"] },
        ],
      },
    ],
    { activeVersionId: "v1" },
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  useHistoryStore.setState({
    history: [],
    clearHistory: originalClearHistory,
    clearHistoryByLanguage: originalClearHistoryByLanguage,
    applyRetentionPolicy: originalApplyRetentionPolicy,
  });
  useWordStore.getState().clear();
  if (originalWordStoreEntries) {
    useWordStore
      .getState()
      .setVersions(
        "ENGLISH:BILINGUAL:hello",
        originalWordStoreEntries.versions,
        {
          activeVersionId: originalWordStoreEntries.activeVersionId,
          metadata: originalWordStoreEntries.metadata,
        },
      );
  }
  originalWordStoreEntries = undefined;
});

/**
 * 测试目标：渲染 message 时 Section 会暴露辅助描述并建立 aria 关联。
 * 前置条件：传入 message 与 descriptionId。
 * 步骤：
 *  1) 渲染 DataSection；
 *  2) 查询 section 与描述元素。
 * 断言：
 *  - 描述元素的 id 与传入 descriptionId 一致；
 *  - section 上的 aria-describedby 指向该 id。
 * 边界/异常：
 *  - 若缺失关联则会影响屏幕阅读器理解上下文。
 */
test("Given section message When rendering Then description linked for accessibility", () => {
  renderDataSection();

  const section = screen.getByRole("region", { name: "Data" });
  const description = screen.getByText("Control your data");

  expect(description).toHaveAttribute("id", "data-description");
  expect(section).toHaveAttribute("aria-describedby", "data-description");
});

/**
 * 测试目标：语言清理控制区域呈现说明文字，提示仅影响所选语言。
 * 前置条件：默认翻译文案已注入。
 * 步骤：
 *  1) 渲染 DataSection；
 *  2) 查询语言描述文本与容器。
 * 断言：
 *  - 描述文本等于预期翻译；
 *  - 描述文本与语言标签处于同一控制容器内。
 * 边界/异常：
 *  - 若描述缺失，用户可能误认为会清空全部历史。
 */
test("Given language scoped controls When rendering Then language description clarifies scope", () => {
  renderDataSection();

  const description = screen.getByText(
    translations.settingsDataLanguageDescription,
  );
  expect(description).toBeInTheDocument();

  const fieldContainer = description.closest("div");
  expect(fieldContainer).toContainElement(
    screen.getByText(translations.settingsDataLanguageLabel),
  );
});

/**
 * 测试目标：点击“暂停采集”会关闭历史采集开关。
 * 前置条件：采集开关默认为开启。
 * 步骤：
 *  1) 渲染 DataSection；
 *  2) 点击 Pause history 按钮。
 * 断言：
 *  - Store 中 historyCaptureEnabled 变为 false。
 * 边界/异常：
 *  - 若按钮未正确更新状态，则开关失效。
 */
test("Given toggle control When pausing capture Then store reflects disabled", async () => {
  const user = userEvent.setup();
  renderDataSection();

  await user.click(screen.getByRole("radio", { name: /Pause history/i }));

  expect(useDataGovernanceStore.getState().historyCaptureEnabled).toBe(false);
});

/**
 * 测试目标：切换保留策略会触发 applyRetentionPolicy。
 * 前置条件：默认保留策略 90d。
 * 步骤：
 *  1) 渲染 DataSection；
 *  2) 点击 30 days 选项。
 * 断言：
 *  - applyRetentionPolicy 被以 30 和用户对象调用。
 * 边界/异常：
 *  - 若策略未触发调用，则无法落实保留窗口。
 */
test("Given retention options When choosing shorter window Then retention command executed", async () => {
  const user = userEvent.setup();
  renderDataSection();

  await user.click(screen.getByRole("radio", { name: /30 days/i }));

  const applyRetention = useHistoryStore.getState().applyRetentionPolicy;
  expect(applyRetention).toHaveBeenCalledTimes(1);
  expect(applyRetention.mock.calls[0][0]).toBe(30);
  expect(applyRetention.mock.calls[0][1]).toEqual({ token: "token-1" });
  expect(useDataGovernanceStore.getState().retentionPolicyId).toBe("30d");
});

/**
 * 测试目标：点击“清空所选语言”会按语言调用清理命令。
 * 前置条件：历史中包含 ENGLISH 项。
 * 步骤：
 *  1) 渲染 DataSection；
 *  2) 点击 Clear selected language 按钮。
 * 断言：
 *  - clearHistoryByLanguage 被以 "ENGLISH" 调用。
 * 边界/异常：
 *  - 若未传入语言参数则会误清空。
 */
test("Given language actions When clearing selected language Then scoped command fired", async () => {
  const user = userEvent.setup();
  renderDataSection();

  await user.click(
    screen.getByRole("button", { name: /Clear selected language/i }),
  );

  expect(
    useHistoryStore.getState().clearHistoryByLanguage,
  ).toHaveBeenCalledWith("ENGLISH", { token: "token-1" });
});

/**
 * 测试目标：点击导出按钮会创建 CSV Blob 并调用 URL API。
 * 前置条件：URL.createObjectURL 已被 stub。
 * 步骤：
 *  1) Stub URL API；
 *  2) 渲染组件并点击 Export data。
 * 断言：
 *  - createObjectURL 与 revokeObjectURL 被调用。
 * 边界/异常：
 *  - 若未调用则导出功能失效。
 */
test("Given export action When clicking export Then browser download initiated", async () => {
  const user = userEvent.setup();
  const spies = setupExportSpies();
  try {
    renderDataSection();
    await user.click(screen.getByRole("button", { name: /Export data/i }));

    expect(spies.createUrl).toHaveBeenCalledTimes(1);
    expect(spies.revokeUrl).toHaveBeenCalledTimes(1);
    expect(spies.appendSpy).toHaveBeenCalled();
    expect(spies.removeSpy).toHaveBeenCalled();
    expect(
      spies.appendSpy.mock.calls.some((call) => call?.[0]?.tagName === "A"),
    ).toBe(true);

    const blob = spies.createUrl.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/csv;charset=utf-8");
  } finally {
    spies.restore();
  }
});

test("Given export action When generating csv Then history rows captured", async () => {
  const user = userEvent.setup();
  const spies = setupExportSpies();
  try {
    renderDataSection();
    await user.click(screen.getByRole("button", { name: /Export data/i }));

    const csvText = extractCsvText(spies.blobCalls);
    expect(csvText).toContain("term,language,flavor,chapter,content");
    expect(csvText).toContain(
      "hello,ENGLISH,BILINGUAL,Definitions,A friendly greeting",
    );
  } finally {
    spies.restore();
  }
});
