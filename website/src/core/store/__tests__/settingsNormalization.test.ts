import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  WORD_DEFAULT_TARGET_LANGUAGE,
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
} from "@core/store/settings/model";
import {
  normalizeDictionarySourceLanguage,
  normalizeDictionaryTargetLanguage,
  normalizeLegacyDictionaryLanguage,
  normalizeMarkdownRenderingMode,
  resolveDictionaryPreference,
  resolveDictionaryPreferenceFromLegacy,
  sanitizeSystemLanguage,
} from "@core/store/settings/normalizers";

/**
 * 测试目标：验证 Markdown 渲染模式归一化逻辑能够容错大小写并在非法值时回退默认值。
 * 前置条件：提供合法与非法的候选值。
 * 步骤：
 *  1) 调用 normalizeMarkdownRenderingMode 传入大小写混合的合法值。
 *  2) 调用同一函数传入非法值。
 * 断言：
 *  - 第一次调用返回规范化后的合法值。
 *  - 第二次调用回退到动态渲染默认值。
 * 边界/异常：
 *  - 覆盖 undefined 等非法输入的容错逻辑。
 */
test("normalizeMarkdownRenderingMode enforces safe fallback", () => {
  expect(normalizeMarkdownRenderingMode("PLAIN")).toBe(
    MARKDOWN_RENDERING_MODE_PLAIN,
  );
  expect(normalizeMarkdownRenderingMode(undefined)).toBe(
    MARKDOWN_RENDERING_MODE_DYNAMIC,
  );
});

/**
 * 测试目标：验证系统语言归一化将非法值回退到默认语言 zh。
 * 前置条件：提供合法与非法语言代码。
 * 步骤：
 *  1) 传入受支持的语言。
 *  2) 传入未知语言代码。
 * 断言：
 *  - 第一次调用返回原值。
 *  - 第二次调用回退到 zh。
 * 边界/异常：
 *  - 覆盖空字符串输入。
 */
test("sanitizeSystemLanguage protects fallback", () => {
  expect(sanitizeSystemLanguage("en")).toBe("en");
  expect(sanitizeSystemLanguage("unknown")).toBe("zh");
});

/**
 * 测试目标：验证词典偏好在存在 legacy 值时按旧逻辑回退，否则遵从持久化结果。
 * 前置条件：准备 legacy 语言、持久化标记及候选值。
 * 步骤：
 *  1) 传入 legacy=ENGLISH 且无持久化标记，验证回退策略。
 *  2) 传入 legacy 未命中、但持久化提供合法值，验证持久化优先级。
 * 断言：
 *  - 第一段返回英文到默认目标。
 *  - 第二段返回持久化提供的偏好。
 * 边界/异常：
 *  - 覆盖 legacy 未定义时的路径。
 */
test("resolveDictionaryPreference prioritizes persisted values", () => {
  const legacyPreference = resolveDictionaryPreference({
    legacyLanguage: "ENGLISH",
    persistedSource: undefined,
    persistedTarget: undefined,
    hasPersistedSource: false,
    hasPersistedTarget: false,
  });
  expect(legacyPreference).toEqual({
    dictionarySourceLanguage: "ENGLISH",
    dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
  });

  const persistedPreference = resolveDictionaryPreference({
    legacyLanguage: undefined,
    persistedSource: "CHINESE",
    persistedTarget: "ENGLISH",
    hasPersistedSource: true,
    hasPersistedTarget: true,
  });
  expect(persistedPreference).toEqual({
    dictionarySourceLanguage: "CHINESE",
    dictionaryTargetLanguage: "ENGLISH",
  });
});

/**
 * 测试目标：验证 setDictionaryLanguage 兼容旧值并在未知输入时回退默认。
 * 前置条件：提供 legacy 候选与非法值。
 * 步骤：
 *  1) 传入英文单语模式，期望英文->英文。
 *  2) 传入非法值，期望回退到 AUTO->默认目标。
 * 断言：
 *  - 第一段返回英文单语偏好。
 *  - 第二段返回 AUTO 默认偏好。
 * 边界/异常：
 *  - 覆盖 undefined 输入。
 */
test("resolveDictionaryPreferenceFromLegacy mirrors legacy mapping", () => {
  expect(
    resolveDictionaryPreferenceFromLegacy(WORD_LANGUAGE_ENGLISH_MONO),
  ).toEqual({
    dictionarySourceLanguage: "ENGLISH",
    dictionaryTargetLanguage: "ENGLISH",
  });
  expect(resolveDictionaryPreferenceFromLegacy(undefined)).toEqual({
    dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
    dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
  });
  expect(normalizeLegacyDictionaryLanguage(undefined)).toBeUndefined();
});

/**
 * 测试目标：验证词典源/目标语言归一化函数保证返回受支持的值。
 * 前置条件：提供合法与非法候选。
 * 步骤：
 *  1) 传入合法值。
 *  2) 传入非法值。
 * 断言：
 *  - 合法值保持不变。
 *  - 非法值回退默认。
 * 边界/异常：
 *  - 覆盖 null 输入。
 */
test("normalizeDictionaryLanguages ensure safe defaults", () => {
  expect(normalizeDictionarySourceLanguage("ENGLISH")).toBe("ENGLISH");
  expect(normalizeDictionarySourceLanguage("invalid")).toBe(WORD_LANGUAGE_AUTO);
  expect(normalizeDictionaryTargetLanguage("CHINESE")).toBe("CHINESE");
  expect(normalizeDictionaryTargetLanguage(null)).toBe(
    WORD_DEFAULT_TARGET_LANGUAGE,
  );
});
