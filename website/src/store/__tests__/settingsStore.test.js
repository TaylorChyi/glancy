import { act } from "@testing-library/react";
import { useSettingsStore } from "@/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";
import { WORD_LANGUAGE_AUTO } from "@/utils/language.js";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    const setter = useSettingsStore.getState().setSystemLanguage;
    const dictionarySetter = useSettingsStore.getState().setDictionaryLanguage;
    useSettingsStore.setState(
      {
        systemLanguage: SYSTEM_LANGUAGE_AUTO,
        setSystemLanguage: setter,
        dictionaryLanguage: WORD_LANGUAGE_AUTO,
        setDictionaryLanguage: dictionarySetter,
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
    expect(useSettingsStore.getState().dictionaryLanguage).toBe(
      WORD_LANGUAGE_AUTO,
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

  /**
   * 验证词典语言模式可写入并持久化，且不支持的值会回退到自动检测。
   */
  test("setDictionaryLanguage normalizes preference", () => {
    act(() => useSettingsStore.getState().setDictionaryLanguage("CHINESE"));
    expect(useSettingsStore.getState().dictionaryLanguage).toBe("CHINESE");
    act(() => useSettingsStore.getState().setDictionaryLanguage("invalid"));
    expect(useSettingsStore.getState().dictionaryLanguage).toBe(
      WORD_LANGUAGE_AUTO,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionaryLanguage).toBe("AUTO");
  });
});
