import { afterEach, describe, expect, test } from "@jest/globals";
import {
  detectBrowserLanguage,
  resolveLanguage,
} from "@core/context/languageUtils.js";

const ORIGINAL_NAVIGATOR = global.navigator;

afterEach(() => {
  if (ORIGINAL_NAVIGATOR) {
    Object.defineProperty(global, "navigator", {
      value: ORIGINAL_NAVIGATOR,
      configurable: true,
      writable: false,
    });
  } else {
    // eslint-disable-next-line no-undef
    delete global.navigator;
  }
});

describe("LanguageContext helpers", () => {
  /**
   * 测试目标：系统语言为受支持语言时直接返回用户设置。
   * 前置条件：systemLanguage 为 "en"，browserLanguage 为 "zh"。
   * 步骤：
   *  1) 调用 resolveLanguage 传入设置与浏览器语言。
   * 断言：
   *  - 返回值等于 "en"。
   * 边界/异常：
   *  - systemLanguage 若不受支持则回退到浏览器语言（见其他用例）。
   */
  test("Given supported system language When resolving Then returns system value", () => {
    expect(
      resolveLanguage({ systemLanguage: "en", browserLanguage: "zh" }),
    ).toBe("en");
  });

  /**
   * 测试目标：systemLanguage 为 auto 时回退到浏览器首选语言。
   * 前置条件：browserLanguage 为 "zh"。
   * 步骤：
   *  1) 调用 resolveLanguage 传入 systemLanguage 为 "auto"。
   * 断言：
   *  - 返回值等于 "zh"。
   * 边界/异常：
   *  - 若浏览器语言同样不受支持将使用默认语言（见后续用例）。
   */
  test("Given auto system language When resolving Then uses browser language", () => {
    expect(
      resolveLanguage({ systemLanguage: "auto", browserLanguage: "zh" }),
    ).toBe("zh");
  });

  /**
   * 测试目标：当系统与浏览器语言均不可用时回退到默认语言。
   * 前置条件：两者均提供不受支持的取值。
   * 步骤：
   *  1) 调用 resolveLanguage 传入无效语言。
   * 断言：
   *  - 返回值等于默认的 "zh"。
   * 边界/异常：
   *  - 默认语言与翻译资源绑定，如变更需同步更新测试。
   */
  test("Given unsupported inputs When resolving Then returns default language", () => {
    expect(
      resolveLanguage({ systemLanguage: "auto", browserLanguage: "fr" }),
    ).toBe("zh");
  });

  /**
   * 测试目标：detectBrowserLanguage 会读取 navigator.languages 并返回首个受支持主语言。
   * 前置条件：模拟浏览器偏好列表为 ["fr-FR", "EN-US"], navigator.language 为 "zh-CN"。
   * 步骤：
   *  1) 覆写 global.navigator；
   *  2) 调用 detectBrowserLanguage。
   * 断言：
   *  - 返回值等于 "en"（跳过不受支持的 fr）。
   * 边界/异常：
   *  - 若 languages 为空则会使用 navigator.language（此处未覆盖）。
   */
  test("Given navigator languages When detecting Then selects first supported", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        languages: ["fr-FR", "EN-US"],
        language: "zh-CN",
      },
      configurable: true,
      writable: false,
    });

    expect(detectBrowserLanguage()).toBe("en");
  });
});
