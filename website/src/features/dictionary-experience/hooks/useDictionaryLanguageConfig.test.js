import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";

const translationFixture = {
  dictionarySourceLanguageAuto: "自动检测",
  dictionarySourceLanguageAutoDescription: "自动识别语言",
  dictionarySourceLanguageEnglish: "英文",
  dictionarySourceLanguageEnglishDescription: "使用英文解释",
  dictionarySourceLanguageChinese: "中文",
  dictionarySourceLanguageChineseDescription: "使用中文解释",
  dictionaryTargetLanguageChinese: "中文",
  dictionaryTargetLanguageChineseDescription: "输出中文",
  dictionaryTargetLanguageEnglish: "英文",
  dictionaryTargetLanguageEnglishDescription: "输出英文",
};

const mockSettingsState = {
  dictionarySourceLanguage: "AUTO",
  dictionaryTargetLanguage: "CHINESE",
  setDictionarySourceLanguage: jest.fn(),
  setDictionaryTargetLanguage: jest.fn(),
};

jest.unstable_mockModule("@shared/utils", () => ({
  WORD_LANGUAGE_AUTO: "AUTO",
  normalizeWordSourceLanguage: jest.fn((value) => value ?? "AUTO"),
  normalizeWordTargetLanguage: jest.fn((value) => value ?? "CHINESE"),
  resolveDictionaryFlavor: jest.fn(() => "default"),
}));

const useSettingsStore = (selector) => selector(mockSettingsState);

jest.unstable_mockModule("@core/store", () => ({
  useSettingsStore,
}));

const { useDictionaryLanguageConfig } = await import(
  "./useDictionaryLanguageConfig.js"
);

describe("useDictionaryLanguageConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettingsState.dictionarySourceLanguage = "AUTO";
    mockSettingsState.dictionaryTargetLanguage = "CHINESE";
  });

  /**
   * 测试路径：读取语言配置，期望暴露正确的选项与风味。
   * 步骤：执行 Hook 并读取返回值。
   * 断言：选项数量与 flavor 与预期一致。
   */
  it("returns language options and flavor metadata", () => {
    const { result } = renderHook(() =>
      useDictionaryLanguageConfig({ t: translationFixture }),
    );

    expect(result.current.sourceLanguageOptions).toHaveLength(3);
    expect(result.current.targetLanguageOptions).toHaveLength(2);
    expect(result.current.dictionaryFlavor).toBe("default");
  });

  /**
   * 测试路径：触发语言交换逻辑。
   * 步骤：调用 handleSwapLanguages。
   * 断言：应写入新的源、目标语言。
   */
  it("swaps source and target language settings", () => {
    const { result } = renderHook(() =>
      useDictionaryLanguageConfig({ t: translationFixture }),
    );

    act(() => {
      result.current.handleSwapLanguages();
    });

    expect(mockSettingsState.setDictionarySourceLanguage).toHaveBeenCalled();
    expect(mockSettingsState.setDictionaryTargetLanguage).toHaveBeenCalled();
  });
});
