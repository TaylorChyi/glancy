/* eslint-env jest */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { API_PATHS } from "@/config/api.js";

const mockRequest = jest.fn().mockResolvedValue({});
const mockSetTheme = jest.fn();
const mockTtsVoices = jest.fn().mockResolvedValue([]);
const mockT = {
  prefTitle: "Preferences",
  prefDescription: "Description",
  prefInterfaceTitle: "Interface experience",
  prefLanguage: "Source Language",
  prefSearchLanguage: "Target Language",
  prefVoiceEn: "English Voice",
  prefVoiceZh: "Chinese Voice",
  prefTheme: "Theme",
  settingsTabGeneral: "General",
  saveButton: "Save changes",
  saving: "Saving...",
  saveSuccess: "Saved",
  fail: "Fail",
  autoDetect: "Auto",
  CHINESE: "CHINESE",
  ENGLISH: "ENGLISH",
  close: "Close",
};

jest.unstable_mockModule("@/context", () => ({
  // Aggregate all required context hooks for clarity
  useLanguage: () => ({ t: mockT, lang: "en" }),
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
  useUser: () => ({ user: { id: "1", token: "t" } }),
  useHistory: () => ({}),
  useApiContext: () => ({}),
  useLocale: () => ({ locale: { lang: "en" } }),
}));
jest.unstable_mockModule("@/hooks", () => ({
  useEscapeKey: () => ({ on: () => {}, off: () => {} }),
  useOutsideToggle: () => ({
    open: false,
    setOpen: () => {},
    ref: { current: null },
  }),
  useMediaQuery: () => false,
}));
jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: () => ({
    request: mockRequest,
    jsonRequest: mockRequest,
    words: { streamWord: jest.fn() },
    tts: { fetchVoices: mockTtsVoices },
  }),
}));
jest.unstable_mockModule("@/components", () => ({
  __esModule: true,
  VoiceSelector: ({ lang }) => <div data-testid={`voice-selector-${lang}`} />,
  SettingsSurface: ({ title, description, actions, children }) => (
    <section>
      <header>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {actions}
      </header>
      <div>{children}</div>
    </section>
  ),
  SETTINGS_SURFACE_VARIANTS: {
    MODAL: "modal",
    PAGE: "page",
  },
}));
jest.unstable_mockModule("@/store", () => ({
  useUserStore: (fn) => fn({ user: { plan: "free" } }),
  useVoiceStore: (fn) =>
    fn({ voices: {}, setVoice: jest.fn(), getVoice: () => undefined }),
  useFavoritesStore: (fn) =>
    fn({
      favorites: [],
      toggleFavorite: jest.fn(),
      includes: () => false,
    }),
  useHistoryStore: (fn) =>
    fn({
      history: [],
      loadHistory: jest.fn(),
      addHistory: jest.fn(),
      removeHistory: jest.fn(),
    }),
  useWordStore: (fn) =>
    fn({
      entries: new Map(),
      setVersions: jest.fn(),
      getEntry: jest.fn(),
      getRecord: jest.fn(),
    }),
}));
jest.unstable_mockModule("@/assets/icons.js", () => ({
  __esModule: true,
  default: {},
}));

const {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} = await import("@/utils/language.js");
const { SYSTEM_LANGUAGE_AUTO } = await import("@/i18n/languages.js");

const mockSettingsState = {
  systemLanguage: SYSTEM_LANGUAGE_AUTO,
  dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
  dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
};

const buildSettingsSlice = () => ({
  systemLanguage: mockSettingsState.systemLanguage,
  setSystemLanguage: (language) => {
    mockSettingsState.systemLanguage = language;
  },
  dictionarySourceLanguage: mockSettingsState.dictionarySourceLanguage,
  setDictionarySourceLanguage: (language) => {
    mockSettingsState.dictionarySourceLanguage =
      normalizeWordSourceLanguage(language);
  },
  dictionaryTargetLanguage: mockSettingsState.dictionaryTargetLanguage,
  setDictionaryTargetLanguage: (language) => {
    mockSettingsState.dictionaryTargetLanguage =
      normalizeWordTargetLanguage(language);
  },
});

const useSettingsStoreMock = (selector) => selector(buildSettingsSlice());
useSettingsStoreMock.getState = () => buildSettingsSlice();
useSettingsStoreMock.setState = (updater) => {
  const next =
    typeof updater === "function" ? updater({ ...mockSettingsState }) : updater;
  if (next && typeof next === "object") {
    if (Object.prototype.hasOwnProperty.call(next, "systemLanguage")) {
      mockSettingsState.systemLanguage = next.systemLanguage;
    }
    if (
      Object.prototype.hasOwnProperty.call(next, "dictionarySourceLanguage")
    ) {
      mockSettingsState.dictionarySourceLanguage =
        next.dictionarySourceLanguage;
    }
    if (
      Object.prototype.hasOwnProperty.call(next, "dictionaryTargetLanguage")
    ) {
      mockSettingsState.dictionaryTargetLanguage =
        next.dictionaryTargetLanguage;
    }
  }
};
useSettingsStoreMock.reset = () => {
  mockSettingsState.systemLanguage = SYSTEM_LANGUAGE_AUTO;
  mockSettingsState.dictionarySourceLanguage = WORD_LANGUAGE_AUTO;
  mockSettingsState.dictionaryTargetLanguage = WORD_DEFAULT_TARGET_LANGUAGE;
};

jest.unstable_mockModule("@/store/settings", () => ({
  useSettingsStore: useSettingsStoreMock,
  SUPPORTED_SYSTEM_LANGUAGES: ["en"],
}));

const { default: Preferences } = await import("@/pages/preferences");
const { default: SettingsModal } = await import(
  "@/components/modals/SettingsModal.jsx"
);
const { useSettingsStore } = await import("@/store/settings");

beforeEach(() => {
  localStorage.clear();
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
  mockSetTheme.mockClear();
  useSettingsStore.setState({
    dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
    dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
    systemLanguage: SYSTEM_LANGUAGE_AUTO,
  });
});

/**
 * Ensures user preference changes trigger API requests and persist through
 * the mocked backend service.
 */
test("saves preferences via api", async () => {
  await act(async () => {
    render(<Preferences />);
  });
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Source Language"), {
    target: { value: "CHINESE" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(mockRequest).toHaveBeenCalled());
  expect(mockRequest.mock.calls[0][0]).toBe(`${API_PATHS.preferences}/user`);
});

/**
 * 防止设置页因缺失主题数据而覆盖用户的显式选择。
 */
test("keeps user theme when server does not provide one", async () => {
  await act(async () => {
    render(<Preferences />);
  });
  await act(async () => {});
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
  expect(mockSetTheme).not.toHaveBeenCalled();
});

/**
 * 测试目标：设置弹窗应渲染自定义关闭按钮，并保证焦点留在弹窗内部且 aria 属性正确。
 * 前置条件：
 *  - SettingsModal 以 open=true 渲染，使用 jest 上下文 mock。
 * 步骤：
 *  1) 渲染组件并等待初次 effect。
 *  2) 查询关闭按钮与 dialog 节点。
 *  3) 校验 dialog 的 aria 属性与焦点范围。
 * 断言：
 *  - 关闭按钮存在，dialog 具备 aria-modal 属性，当前焦点位于弹窗内。
 * 边界/异常：
 *  - 若焦点跑出弹窗或 aria 属性缺失，测试失败以提示回归。
 */
test("GivenSettingsModal_WhenOpened_ThenCustomCloseButtonRenderedWithAriaContext", async () => {
  const handleClose = jest.fn();

  await act(async () => {
    render(<SettingsModal open onClose={handleClose} />);
  });

  const [closeButton] = await screen.findAllByRole("button", { name: "Close" });
  const dialog = screen.getByRole("dialog");

  expect(closeButton).toBeVisible();
  expect(dialog).toHaveAttribute("aria-modal", "true");
  await waitFor(() => {
    expect(dialog).toContainElement(document.activeElement);
  });
});

/**
 * 测试目标：点击设置弹窗中的关闭按钮应触发 onClose 回调。
 * 前置条件：
 *  - SettingsModal 处于打开状态，并注入 jest.fn() 作为 onClose。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击关闭按钮。
 * 断言：
 *  - onClose 被调用一次，表明事件链路畅通。
 * 边界/异常：
 *  - 若按钮缺失或点击未触发回调，测试失败以暴露回归。
 */
test("GivenSettingsModal_WhenCloseClicked_ThenOnCloseFires", async () => {
  const handleClose = jest.fn();

  await act(async () => {
    render(<SettingsModal open onClose={handleClose} />);
  });

  const [modalCloseButton] = screen.getAllByRole("button", { name: "Close" });
  fireEvent.click(modalCloseButton);

  expect(handleClose).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：
 *  - 默认页面模式不应渲染关闭按钮，确保布局纯粹。
 * 前置条件：
 *  - 渲染未提供 onClose 的 Preferences 页面。
 * 步骤：
 *  1) 渲染组件并等待初次 effect。
 * 断言：
 *  - 查询关闭按钮返回 null，避免误露出无效控件。
 * 边界/异常：
 *  - 若默认模式渲染按钮则测试失败，提示可访问性回归。
 */
test("GivenPreferencesWithoutOnClose_WhenRendered_ThenCloseButtonHidden", async () => {
  await act(async () => {
    render(<Preferences />);
  });
  await act(async () => {});

  expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
});

/**
 * 测试目标：
 *  - 对话框模式应渲染关闭按钮并在点击时触发回调。
 * 前置条件：
 *  - 注入 onClose 模拟函数，并以 dialog 变体渲染组件。
 * 步骤：
 *  1) 渲染组件并等待初次 effect。
 *  2) 获取关闭按钮并触发点击。
 * 断言：
 *  - onClose 恰好被调用一次，说明事件链路正确。
 * 边界/异常：
 *  - 若按钮缺失或多次触发，则视为交互回归。
 */
test("GivenPreferencesDialog_WhenCloseClicked_ThenOnCloseInvoked", async () => {
  const handleClose = jest.fn();

  await act(async () => {
    render(<Preferences variant="dialog" onClose={handleClose} />);
  });
  await act(async () => {});

  const closeButton = screen.getByRole("button", { name: "Close" });
  fireEvent.click(closeButton);

  expect(handleClose).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：
 *  - 关闭按钮需支持键盘 Enter 激活，保障可访问性。
 * 前置条件：
 *  - 渲染带 onClose 的 dialog 变体并准备 userEvent。
 * 步骤：
 *  1) 渲染组件并聚焦关闭按钮。
 *  2) 通过键盘输入 Enter 激活。
 * 断言：
 *  - onClose 被调用一次，证明键盘路径生效。
 * 边界/异常：
 *  - 若键盘触发未生效，则需检查按钮语义或事件绑定。
 */
test("GivenPreferencesDialog_WhenEnterPressedOnClose_ThenOnCloseInvoked", async () => {
  const handleClose = jest.fn();
  const user = userEvent.setup();

  await act(async () => {
    render(<Preferences variant="dialog" onClose={handleClose} />);
  });
  await act(async () => {});

  const closeButton = screen.getByRole("button", { name: "Close" });
  closeButton.focus();
  expect(closeButton).toHaveFocus();

  await user.keyboard("{Enter}");

  expect(handleClose).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：确保设置页侧栏标签与主标题使用不同文案，维持信息层级清晰。
 * 前置条件：默认渲染 Preferences 页面，并提供区分的翻译文案。
 * 步骤：
 *  1) 渲染组件。
 *  2) 捕获当前激活的导航标签与内容标题。
 * 断言：
 *  - 标签文本与标题文本不相等，否则提示文案配置回退。
 * 边界/异常：
 *  - 若翻译缺失导致文本一致，应提醒补齐翻译或调整默认值。
 */
test("renders distinct copy between navigation and heading", async () => {
  await act(async () => {
    render(<Preferences />);
  });
  await act(async () => {});

  const activeTab = screen.getByRole("tab", { selected: true });
  const heading = screen.getByRole("heading", { level: 2 });

  expect(activeTab.textContent?.trim()).not.toBe(heading.textContent?.trim());
});

/**
 * 确认后端返回的主题值不会在用户未操作时触发全局主题切换。
 */
test("ignores remote theme preference without user input", async () => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({ theme: "dark" });
  await act(async () => {
    render(<Preferences />);
  });
  await act(async () => {});
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
  expect(mockSetTheme).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Theme").value).toBe("light");
});

/**
 * 确认语言选择会同步更新字典配置的全局 Store，保障即时生效。
 */
test("updates dictionary language preferences in settings store", async () => {
  await act(async () => {
    render(<Preferences />);
  });
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Source Language"), {
    target: { value: "CHINESE" },
  });
  fireEvent.change(screen.getByLabelText("Target Language"), {
    target: { value: "ENGLISH" },
  });
  await waitFor(() => {
    const state = useSettingsStore.getState();
    expect(state.dictionarySourceLanguage).toBe("CHINESE");
    expect(state.dictionaryTargetLanguage).toBe("ENGLISH");
  });
});
