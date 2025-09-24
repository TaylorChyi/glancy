/* eslint-env jest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { API_PATHS } from "@/config/api.js";

const mockRequest = jest.fn().mockResolvedValue({});
const mockSetTheme = jest.fn();
const mockTtsVoices = jest.fn().mockResolvedValue([]);
const mockT = {
  prefTitle: "Preferences",
  prefDescription: "Description",
  prefLanguage: "Language",
  prefSearchLanguage: "Search Language",
  prefVoiceEn: "English Voice",
  prefVoiceZh: "Chinese Voice",
  prefTheme: "Theme",
  saveButton: "Save",
  saveSuccess: "Saved",
  fail: "Fail",
  autoDetect: "Auto",
  CHINESE: "CHINESE",
  ENGLISH: "ENGLISH",
};

jest.unstable_mockModule("@/context", () => ({
  // Aggregate all required context hooks for clarity
  useLanguage: () => ({ t: mockT }),
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
  useUser: () => ({ user: { id: "1", token: "t" } }),
  useHistory: () => ({}),
  useApiContext: () => ({}),
  useLocale: () => ({ locale: { lang: "en" } }),
}));
jest.unstable_mockModule("@/hooks", () => ({
  useApi: () => ({
    request: mockRequest,
    jsonRequest: mockRequest,
    tts: { fetchVoices: mockTtsVoices },
  }),
  useEscapeKey: () => ({ on: () => {}, off: () => {} }),
  useOutsideToggle: () => ({
    open: false,
    setOpen: () => {},
    ref: { current: null },
  }),
  useMediaQuery: () => false,
}));
jest.unstable_mockModule("@/components", () => ({
  __esModule: true,
  VoiceSelector: ({ lang }) => <div data-testid={`voice-selector-${lang}`} />,
}));
jest.unstable_mockModule("@/store", () => ({
  useUserStore: (fn) => fn({ user: { plan: "free" } }),
  useVoiceStore: (fn) =>
    fn({ voices: {}, setVoice: jest.fn(), getVoice: () => undefined }),
}));
jest.unstable_mockModule("@/assets/icons.js", () => ({
  __esModule: true,
  default: {},
}));

const { default: Preferences } = await import("@/pages/preferences");

beforeEach(() => {
  localStorage.clear();
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
  mockSetTheme.mockClear();
});

/**
 * Ensures user preference changes trigger API requests and persist through
 * the mocked backend service.
 */
test("saves preferences via api", async () => {
  render(<Preferences />);
  fireEvent.change(screen.getByLabelText("Language"), {
    target: { value: "CHINESE" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(mockRequest).toHaveBeenCalled());
  expect(mockRequest.mock.calls[0][0]).toBe(`${API_PATHS.preferences}/user`);
});

/**
 * 防止设置页因缺失主题数据而覆盖用户的显式选择。
 */
test("keeps user theme when server does not provide one", async () => {
  render(<Preferences />);
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
  expect(mockSetTheme).not.toHaveBeenCalled();
});

/**
 * 确认后端返回的主题值不会在用户未操作时触发全局主题切换。
 */
test("ignores remote theme preference without user input", async () => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({ theme: "dark" });
  render(<Preferences />);
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
  expect(mockSetTheme).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Theme").value).toBe("light");
});
