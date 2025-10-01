/* eslint-env jest */
import React from "react";
import PropTypes from "prop-types";
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
jest.unstable_mockModule("@/components", async () => {
  const React = await import("react");
  const { forwardRef, useId } = React;

  const SettingsSurface = forwardRef(function SettingsSurface(
    {
      title,
      description,
      actions,
      children,
      variant,
      className = "",
      headingId: providedHeadingId,
      descriptionId: providedDescriptionId,
    },
    ref,
  ) {
    const autoHeadingId = useId();
    const autoDescriptionId = useId();
    const headingId = providedHeadingId ?? autoHeadingId;
    const resolvedDescriptionId = description
      ? providedDescriptionId ?? autoDescriptionId
      : undefined;

    return (
      <section
        ref={ref}
        className={className}
        aria-labelledby={headingId}
        aria-describedby={resolvedDescriptionId}
        data-variant={variant}
      >
        <header>
          <h2 id={headingId}>{title}</h2>
          {description ? (
            <p id={resolvedDescriptionId}>{description}</p>
          ) : null}
        </header>
        <div>{children}</div>
        {actions ? <footer>{actions}</footer> : null}
      </section>
    );
  });

  SettingsSurface.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    actions: PropTypes.node,
    children: PropTypes.node,
    variant: PropTypes.string,
    className: PropTypes.string,
    headingId: PropTypes.string,
    descriptionId: PropTypes.string,
  };

  return {
    __esModule: true,
    VoiceSelector: ({ lang }) => <div data-testid={`voice-selector-${lang}`} />,
    SettingsSurface,
    SETTINGS_SURFACE_VARIANTS: { MODAL: "modal", PAGE: "page" },
  };
});
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
const { default: SettingsModal } = await import(
  "@/components/modals/SettingsModal.jsx"
);

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
 * 测试目标：设置弹窗应隐藏默认关闭按钮并使用动作槽位的自定义按钮。
 * 前置条件：
 *  - `SettingsModal` 以 `open=true` 渲染。
 *  - 语言上下文提供 `prefTitle`、`prefDescription`、`close` 文案。
 * 步骤：
 *  1) 渲染组件并等待副作用完成。
 *  2) 查询“Close”按钮并触发点击。
 *  3) 读取对话框的 aria 属性。
 * 断言：
 *  - 仅存在动作槽位中的关闭按钮，点击后触发 `onClose`。
 *  - 对话框 `aria-labelledby` 与 `aria-describedby` 均指向实际文案节点。
 * 边界/异常：
 *  - 若未来移除描述文案，应允许 `aria-describedby` 为空。
 */
test("renders custom close control inside settings modal actions", async () => {
  const handleClose = jest.fn();

  await act(async () => {
    render(<SettingsModal open onClose={handleClose} />);
  });
  await act(async () => {});

  const closeButton = screen.getByRole("button", { name: "Close" });
  expect(closeButton).toBeInTheDocument();
  fireEvent.click(closeButton);
  expect(handleClose).toHaveBeenCalledTimes(1);

  expect(screen.queryByText("×")).toBeNull();

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");

  const labelledBy = dialog.getAttribute("aria-labelledby");
  if (labelledBy) {
    const titleNode = document.getElementById(labelledBy);
    expect(titleNode).not.toBeNull();
    expect(titleNode?.textContent).toContain("Preferences");
  } else {
    throw new Error("Expected dialog to reference a heading for accessibility");
  }

  const describedBy = dialog.getAttribute("aria-describedby");
  if (describedBy) {
    const descriptionNode = document.getElementById(describedBy);
    expect(descriptionNode).not.toBeNull();
    expect(descriptionNode?.textContent).toContain("Description");
  }
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
