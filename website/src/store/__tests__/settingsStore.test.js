import { act } from "@testing-library/react";
import { useSettingsStore } from "@/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@/utils/language.js";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    const state = useSettingsStore.getState();
    useSettingsStore.setState(
      {
        systemLanguage: SYSTEM_LANGUAGE_AUTO,
        setSystemLanguage: state.setSystemLanguage,
        dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
        setDictionarySourceLanguage: state.setDictionarySourceLanguage,
        dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
        setDictionaryTargetLanguage: state.setDictionaryTargetLanguage,
        setDictionaryLanguage: state.setDictionaryLanguage,
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
    expect(useSettingsStore.getState().dictionarySourceLanguage).toBe(
      WORD_LANGUAGE_AUTO,
    );
    expect(useSettingsStore.getState().dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
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
    expect(useSettingsStore.getState().dictionarySourceLanguage).toBe(
      "CHINESE",
    );
    expect(useSettingsStore.getState().dictionaryTargetLanguage).toBe(
      "ENGLISH",
    );
    act(() => useSettingsStore.getState().setDictionaryLanguage("invalid"));
    expect(useSettingsStore.getState().dictionarySourceLanguage).toBe(
      WORD_LANGUAGE_AUTO,
    );
    expect(useSettingsStore.getState().dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionarySourceLanguage).toBe("AUTO");
    expect(stored.state.dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
  });

  /**
   * 验证新的词典源语言设置会被规范化并写入持久化存储。
   */
  test("setDictionarySourceLanguage persists normalized value", () => {
    act(() =>
      useSettingsStore.getState().setDictionarySourceLanguage("ENGLISH"),
    );
    expect(useSettingsStore.getState().dictionarySourceLanguage).toBe(
      "ENGLISH",
    );
    act(() =>
      useSettingsStore.getState().setDictionarySourceLanguage("invalid"),
    );
    expect(useSettingsStore.getState().dictionarySourceLanguage).toBe(
      WORD_LANGUAGE_AUTO,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionarySourceLanguage).toBe("AUTO");
  });

  /**
   * 验证目标语言设置仅接受受支持选项并提供稳定默认值。
   */
  test("setDictionaryTargetLanguage enforces supported options", () => {
    act(() =>
      useSettingsStore.getState().setDictionaryTargetLanguage("ENGLISH"),
    );
    expect(useSettingsStore.getState().dictionaryTargetLanguage).toBe(
      "ENGLISH",
    );
    act(() =>
      useSettingsStore.getState().setDictionaryTargetLanguage("invalid"),
    );
    expect(useSettingsStore.getState().dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
  });
});
