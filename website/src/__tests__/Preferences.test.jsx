/* eslint-env jest */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { jest } from "@jest/globals";
import { API_PATHS } from "@/config/api.js";

const mockRequest = jest.fn().mockResolvedValue({});
const mockSetTheme = jest.fn();
const mockTtsVoices = jest.fn().mockResolvedValue([]);
const mockT = {
  prefTitle: "Preferences",
  prefDescription: "Description",
  prefLanguage: "Source Language",
  prefSearchLanguage: "Target Language",
  prefVoiceEn: "English Voice",
  prefVoiceZh: "Chinese Voice",
  prefTheme: "Theme",
  saveButton: "Save changes",
  saving: "Saving...",
  saveSuccess: "Saved",
  fail: "Fail",
  autoDetect: "Auto",
  CHINESE: "CHINESE",
  ENGLISH: "ENGLISH",
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
