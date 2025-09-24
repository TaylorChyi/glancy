import { act } from "@testing-library/react";
import { useSettingsStore } from "@/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    const setter = useSettingsStore.getState().setSystemLanguage;
    useSettingsStore.setState(
      {
        systemLanguage: SYSTEM_LANGUAGE_AUTO,
        setSystemLanguage: setter,
      },
      true,
    );
  });

  /**
   * 验证默认状态在无任何持久化数据时为自动跟随系统。
   */
  test("initializes with auto system language", () => {
    expect(useSettingsStore.getState().systemLanguage).toBe(
      SYSTEM_LANGUAGE_AUTO,
    );
  });

  /**
   * 验证写入受支持语言时，状态与本地存储均被同步更新。
   */
  test("setSystemLanguage persists supported language", () => {
    act(() => useSettingsStore.getState().setSystemLanguage("en"));
    expect(useSettingsStore.getState().systemLanguage).toBe("en");
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.systemLanguage).toBe("en");
  });

  /**
   * 验证不受支持的语言输入会回退到默认语言以确保一致的界面体验。
   */
  test("setSystemLanguage falls back for unsupported values", () => {
    act(() => useSettingsStore.getState().setSystemLanguage("xx"));
    expect(useSettingsStore.getState().systemLanguage).toBe("zh");
  });
});
