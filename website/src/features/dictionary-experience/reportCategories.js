/**
 * 背景：
 *  - 举报类别需要与后端枚举保持一致，同时为 UI 提供可迭代的配置项。
 * 目的：
 *  - 在单一文件中声明类别常量，减少魔法字符串并便于未来扩展。
 * 关键决策与取舍：
 *  - 采用数组承载 value 与文案 key，既满足遍历又避免硬编码 label；
 *  - 导出默认类别，确保表单初始状态统一。
 */
export const WORD_REPORT_CATEGORIES = Object.freeze([
  {
    value: "INCORRECT_MEANING",
    labelKey: "reportCategoryIncorrectMeaning",
  },
  {
    value: "MISSING_INFORMATION",
    labelKey: "reportCategoryMissingInformation",
  },
  {
    value: "INAPPROPRIATE_CONTENT",
    labelKey: "reportCategoryInappropriateContent",
  },
  {
    value: "OTHER",
    labelKey: "reportCategoryOther",
  },
]);

export const DEFAULT_WORD_REPORT_CATEGORY = WORD_REPORT_CATEGORIES[0].value;
