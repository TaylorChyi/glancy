import {
  detectWordLanguage,
  resolveWordLanguage,
  normalizeWordLanguage,
  WORD_LANGUAGE_AUTO,
} from "@/utils/language.js";

describe("language utilities", () => {
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

  test("normalizeWordLanguage 统一化各种输入", () => {
    expect(normalizeWordLanguage("english")).toBe("ENGLISH");
    expect(normalizeWordLanguage("CHINESE")).toBe("CHINESE");
    expect(normalizeWordLanguage("unknown")).toBe(WORD_LANGUAGE_AUTO);
  });

  test("resolveWordLanguage 在自动模式下使用检测结果", () => {
    expect(resolveWordLanguage("晨曦", WORD_LANGUAGE_AUTO)).toBe("CHINESE");
    expect(resolveWordLanguage("dawn", WORD_LANGUAGE_AUTO)).toBe("ENGLISH");
    expect(resolveWordLanguage("纹章", "CHINESE")).toBe("CHINESE");
  });
});
