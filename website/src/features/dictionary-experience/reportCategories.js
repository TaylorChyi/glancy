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
