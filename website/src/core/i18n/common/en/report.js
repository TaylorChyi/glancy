/**
 * 背景：
 *  - 报错反馈流程的文案需要集中管理以支撑合规与审计需求。
 * 目的：
 *  - 提供报告入口、分类与提交状态的统一翻译。
 * 关键决策与取舍：
 *  - 保持现有键名兼容，未新增嵌套层级；
 *  - 通过模块化拆分支撑后续接入更多问题分类。
 * 影响范围：
 *  - 词条举报、问题反馈表单。
 * 演进与TODO：
 *  - 日后可在此模块补充多语言审核提示或错误码映射。
 */
const report = {
  report: "Report",
  reportTitle: "Report an issue",
  reportDescription:
    "Tell us what feels off about this entry. We'll investigate shortly.",
  reportTermLabel: "Entry",
  reportLanguageLabel: "Language",
  reportFlavorLabel: "Dictionary",
  reportCategoryLabel: "Issue type",
  reportCategoryHint: "Select the option that best describes the problem.",
  reportDescriptionLabel: "Details (optional)",
  reportDescriptionPlaceholder: "Share additional context or examples.",
  reportSubmit: "Submit report",
  reportSubmitting: "Submitting...",
  reportCancel: "Cancel",
  reportErrorMessage:
    "We couldn't submit the report right now. Please try again later.",
  reportLanguageValueEnglish: "English",
  reportLanguageValueChinese: "Chinese",
  reportFlavorValueBilingual: "Bilingual",
  reportFlavorValueMonolingualEnglish: "English only",
  reportFlavorValueMonolingualChinese: "Chinese only",
  reportCategoryIncorrectMeaning: "Incorrect meaning",
  reportCategoryMissingInformation: "Missing or outdated information",
  reportCategoryInappropriateContent: "Inappropriate or unsafe content",
  reportCategoryOther: "Other",
  reportSuccess: "Thanks for your report. We'll review it soon.",
  reportFailed: "We couldn't file the report right now. Please retry later.",
  reportUnavailable:
    "We couldn't open the report channel. Please reach our concierge team instead.",
};

export default report;
