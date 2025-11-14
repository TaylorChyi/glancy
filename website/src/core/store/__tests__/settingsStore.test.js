import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
} from "@core/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@shared/utils/language.js";
import {
  readSettingsStore,
  resetSettingsStore,
  withSettingsStore,
} from "../test-support/settingsStore.fixtures.ts";

const registerInitializationTest = () => {
  test("initializes with auto system language", () => {
    const state = readSettingsStore();
    expect(state.systemLanguage).toBe(SYSTEM_LANGUAGE_AUTO);
    expect(state.dictionarySourceLanguage).toBe(WORD_LANGUAGE_AUTO);
    expect(state.dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
    expect(state.markdownRenderingMode).toBe(MARKDOWN_RENDERING_MODE_DYNAMIC);
  });
};

const registerSystemLanguageTests = () => {
  test("setSystemLanguage persists supported language", () => {
    withSettingsStore((state) => state.setSystemLanguage("en"));
    expect(readSettingsStore().systemLanguage).toBe("en");
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.systemLanguage).toBe("en");
  });

  test("setSystemLanguage falls back for unsupported values", () => {
    withSettingsStore((state) => state.setSystemLanguage("xx"));
    expect(readSettingsStore().systemLanguage).toBe("zh");
  });
};

const registerDictionaryLanguageTests = () => {
  test("setDictionaryLanguage normalizes preference", () => {
    withSettingsStore((state) => state.setDictionaryLanguage("CHINESE"));
    expect(readSettingsStore().dictionarySourceLanguage).toBe(
      "CHINESE",
    );
    expect(readSettingsStore().dictionaryTargetLanguage).toBe(
      "ENGLISH",
    );
    withSettingsStore((state) => state.setDictionaryLanguage("invalid"));
    expect(readSettingsStore().dictionarySourceLanguage).toBe(
      WORD_LANGUAGE_AUTO,
    );
    expect(readSettingsStore().dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionarySourceLanguage).toBe("AUTO");
    expect(stored.state.dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
  });
};

const registerSourceLanguageTests = () => {
  test("setDictionarySourceLanguage persists normalized value", () => {
    withSettingsStore((state) =>
      state.setDictionarySourceLanguage("ENGLISH"),
    );
    expect(readSettingsStore().dictionarySourceLanguage).toBe(
      "ENGLISH",
    );
    withSettingsStore((state) =>
      state.setDictionarySourceLanguage("invalid"),
    );
    expect(readSettingsStore().dictionarySourceLanguage).toBe(
      WORD_LANGUAGE_AUTO,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionarySourceLanguage).toBe("AUTO");
  });
};

const registerTargetLanguageTests = () => {
  test("setDictionaryTargetLanguage enforces supported options", () => {
    withSettingsStore((state) =>
      state.setDictionaryTargetLanguage("ENGLISH"),
    );
    expect(readSettingsStore().dictionaryTargetLanguage).toBe(
      "ENGLISH",
    );
    withSettingsStore((state) =>
      state.setDictionaryTargetLanguage("invalid"),
    );
    expect(readSettingsStore().dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.dictionaryTargetLanguage).toBe(
      WORD_DEFAULT_TARGET_LANGUAGE,
    );
  });
};

const registerMarkdownTests = () => {
  test("setMarkdownRenderingMode toggles persisted preference", () => {
    withSettingsStore((state) =>
      state.setMarkdownRenderingMode(MARKDOWN_RENDERING_MODE_PLAIN),
    );
    expect(readSettingsStore().markdownRenderingMode).toBe(
      MARKDOWN_RENDERING_MODE_PLAIN,
    );
    withSettingsStore((state) => state.setMarkdownRenderingMode("invalid"));
    expect(readSettingsStore().markdownRenderingMode).toBe(
      MARKDOWN_RENDERING_MODE_DYNAMIC,
    );
    const stored = JSON.parse(localStorage.getItem("settings"));
    expect(stored.state.markdownRenderingMode).toBe(
      MARKDOWN_RENDERING_MODE_DYNAMIC,
    );
  });
};

describe("settingsStore", () => {
  beforeEach(() => {
    resetSettingsStore();
  });

  registerInitializationTest();
  registerSystemLanguageTests();
  registerDictionaryLanguageTests();
  registerSourceLanguageTests();
  registerTargetLanguageTests();
  registerMarkdownTests();
});
