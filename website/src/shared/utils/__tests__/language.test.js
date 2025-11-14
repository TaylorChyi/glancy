import {
  detectWordLanguage,
  resolveWordLanguage,
  normalizeWordLanguage,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  resolveDictionaryConfig,
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
  WORD_FLAVOR_MONOLINGUAL_ENGLISH,
  WORD_FLAVOR_MONOLINGUAL_CHINESE,
} from "@shared/utils/language.js";

function registerDetectWordLanguageTests() {
  test("detectWordLanguage 区分纯英文与中文输入", () => {
    expect(detectWordLanguage("elegance")).toBe("ENGLISH");
    expect(detectWordLanguage("优雅")).toBe("CHINESE");
  });

  test("detectWordLanguage 识别混合文本中的中文字符", () => {
    expect(detectWordLanguage("A＋级定制体验")).toBe("CHINESE");
  });

  test("detectWordLanguage 捕获扩展汉字符号", () => {
    expect(detectWordLanguage("〇")).toBe("CHINESE");
  });
}

function registerNormalizationTests() {
  test("normalizeWordLanguage 统一化各种输入", () => {
    expect(normalizeWordLanguage("english")).toBe("ENGLISH");
    expect(normalizeWordLanguage("CHINESE")).toBe("CHINESE");
    expect(normalizeWordLanguage("unknown")).toBe(WORD_LANGUAGE_AUTO);
  });

  test("normalizeWordSourceLanguage 兼容英英词典旧值", () => {
    expect(normalizeWordSourceLanguage("english_monolingual")).toBe("ENGLISH");
    expect(normalizeWordSourceLanguage("invalid")).toBe(WORD_LANGUAGE_AUTO);
  });

  test("normalizeWordTargetLanguage 强制受支持值", () => {
    expect(normalizeWordTargetLanguage("english")).toBe("ENGLISH");
    expect(normalizeWordTargetLanguage("AUTO")).toBe("CHINESE");
    expect(normalizeWordTargetLanguage(null)).toBe("CHINESE");
  });
}

function registerResolutionTests() {
  test("resolveWordLanguage 在自动模式下使用检测结果", () => {
    expect(resolveWordLanguage("晨曦", WORD_LANGUAGE_AUTO)).toBe("CHINESE");
    expect(resolveWordLanguage("dawn", WORD_LANGUAGE_AUTO)).toBe("ENGLISH");
    expect(resolveWordLanguage("纹章", "CHINESE")).toBe("CHINESE");
  });

  test("resolveDictionaryConfig 在不同组合下返回对应口味", () => {
    expect(
      resolveDictionaryConfig("immaculate", {
        sourceLanguage: "ENGLISH",
        targetLanguage: "ENGLISH",
      }),
    ).toEqual({ language: "ENGLISH", flavor: WORD_FLAVOR_MONOLINGUAL_ENGLISH });

    expect(
      resolveDictionaryConfig("优雅", {
        sourceLanguage: WORD_LANGUAGE_AUTO,
        targetLanguage: "CHINESE",
      }),
    ).toEqual({ language: "CHINESE", flavor: WORD_FLAVOR_MONOLINGUAL_CHINESE });

    expect(
      resolveDictionaryConfig("优雅", {
        sourceLanguage: "CHINESE",
        targetLanguage: "ENGLISH",
      }),
    ).toEqual({ language: "CHINESE", flavor: WORD_FLAVOR_BILINGUAL });
  });
}

describe("language utilities", () => {
  describe("word language detection", registerDetectWordLanguageTests);

  describe("word normalization", registerNormalizationTests);

  describe("dictionary resolution", registerResolutionTests);
});
