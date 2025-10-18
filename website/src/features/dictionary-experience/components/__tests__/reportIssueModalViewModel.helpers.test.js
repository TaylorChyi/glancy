import {
  buildModalStrings,
  buildSummaryItems,
  createCategoryOptions,
  createLanguageLabels,
  resolveLanguageContext,
} from "../reportIssueModalViewModel.helpers";

const baseTranslations = {
  reportLanguageValueEnglish: "English",
  reportLanguageValueChinese: "Chinese",
  dictionarySourceLanguageAuto: "Auto",
  reportTermLabel: "Term",
  reportLanguageLabel: "Language",
  reportFlavorLabel: "Dictionary",
};

describe("reportIssueModalViewModel.helpers", () => {
  test("Given auto preferences When flavor indicates Chinese Then fallback to Chinese direction", () => {
    /**
     * 测试目标：验证 resolveLanguageContext 在未显式指定语言时依据口味回退；
     * 前置条件：language/source/target 均为空，flavor 设置为 MONOLINGUAL_CHINESE；
     * 步骤：
     *  1) 构造基础翻译文案；
     *  2) 调用 resolveLanguageContext；
     * 断言：
     *  - 源语言键应为 CHINESE，目标语言键也应回退为 CHINESE；
     * 边界/异常：
     *  - 字典模式标签需返回非空字符串，以覆盖缺省路径。
     */
    const languageLabels = createLanguageLabels(baseTranslations);
    const context = resolveLanguageContext({
      language: null,
      flavor: "monolingual_chinese",
      sourceLanguage: null,
      targetLanguage: null,
      languageLabels,
    });

    expect(context.resolvedSourceKey).toBe("CHINESE");
    expect(context.resolvedTargetKey).toBe("CHINESE");
    expect(context.dictionaryModeLabel).toContain("Chinese");
  });

  test("Given explicit language When building summary Then include dictionary context", () => {
    /**
     * 测试目标：验证 buildSummaryItems 根据语言与模式生成完整摘要；
     * 前置条件：提供英语语言标签与中英双语方向；
     * 步骤：
     *  1) 调用 buildSummaryItems；
     *  2) 收集生成的条目；
     * 断言：
     *  - 列表应包含词条、语言与词典模式三项；
     * 边界/异常：
     *  - 确保字典模式标签存在时不会被过滤。
     */
    const items = buildSummaryItems({
      term: "apple",
      language: "en",
      resolvedLanguageLabel: "English",
      dictionaryModeLabel: "English → Chinese",
      translations: baseTranslations,
    });

    expect(items).toHaveLength(3);
    expect(items[1]).toMatchObject({ key: "language", value: "English" });
    expect(items[2]).toMatchObject({
      key: "dictionary-mode",
      value: "English → Chinese",
    });
  });

  test("Given categories When creating options Then reuse translation keys", () => {
    /**
     * 测试目标：验证 createCategoryOptions 正确映射翻译键与值；
     * 前置条件：提供包含 labelKey 的类别数组；
     * 步骤：
     *  1) 调用 createCategoryOptions；
     *  2) 检查返回数组结构；
     * 断言：
     *  - id/value 应与原 value 保持一致；
     *  - label 应从翻译对象中解析；
     * 边界/异常：
     *  - 确认当翻译缺失时函数不会抛错（通过默认值覆盖）。
     */
    const options = createCategoryOptions(
      [
        { value: "typo", labelKey: "reportCategoryTypo" },
        { value: "other", labelKey: "missingKey" },
      ],
      {
        ...baseTranslations,
        reportCategoryTypo: "Typo",
      },
    );

    expect(options[0]).toEqual({ id: "typo", value: "typo", label: "Typo" });
    expect(options[1]).toEqual({ id: "other", value: "other", label: "other" });
  });

  test("Given translations When building modal strings Then honor fallbacks", () => {
    /**
     * 测试目标：验证 buildModalStrings 能正确读取翻译并在缺失时使用默认值；
     * 前置条件：仅提供部分翻译键与错误信息；
     * 步骤：
     *  1) 调用 buildModalStrings；
     *  2) 检查关键字段的回退逻辑；
     * 断言：
     *  - cancel 与 submitting 文案使用备选键；
     *  - 未提供的标题使用默认值；
     *  - 错误消息沿用参数值；
     * 边界/异常：
     *  - 当错误为空时应返回空字符串（未在本例中覆盖）。
     */
    const strings = buildModalStrings(
      {
        reportCancel: "Abort",
        loading: "Loading",
      },
      "Network error",
    );

    expect(strings.title).toBe("Report an issue");
    expect(strings.cancelLabel).toBe("Abort");
    expect(strings.submittingLabel).toBe("Loading");
    expect(strings.errorMessage).toBe("Network error");
  });
});
