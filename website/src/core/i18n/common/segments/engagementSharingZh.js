/**
 * 背景：
 *  - 分享与举报流程的文案耦合在主翻译文件，扩展新渠道时难以及时对齐。
 * 目的：
 *  - 独立抽离分享、举报相关文本，保障用户生成内容治理流程清晰可管。
 * 关键决策与取舍：
 *  - 延续平铺键名，确保表单与弹窗无缝迁移；
 *  - 同步包含渠道提示与错误反馈，覆盖完整交互路径。
 * 影响范围：
 *  - 词典分享、举报弹窗及相关通知提示。
 * 演进与TODO：
 *  - 后续可在此增加渠道元数据，以便动态渲染分享选项。
 */
export const ENGAGEMENT_SHARING_TRANSLATIONS_ZH = {
  share: "分享",
  shareMessage: "一起探讨「{term}」的灵感解读。",
  shareSuccess: "链接已准备就绪，随时可分享。",
  shareCopySuccess: "链接已复制，欢迎转发给挚友。",
  shareFailed: "分享暂未完成，请稍后再试。",
  shareOptionLink: "复制分享链接",
  shareOptionImage: "导出释义长图",
  shareImagePreparing: "图片生成中…",
  shareImageSuccess: "图片已导出，欢迎分享。",
  shareImageFailed: "暂无法生成图片，请稍后再试。",
  shareMenuLabel: "分享方式",
  shareAppName: "Glancy 词海",
  report: "举报",
  reportTitle: "举报词条问题",
  reportDescription: "请告知该词条的问题，我们会尽快跟进。",
  reportTermLabel: "词条",
  reportLanguageLabel: "语言",
  reportFlavorLabel: "词典模式",
  reportCategoryLabel: "问题类型",
  reportCategoryHint: "请选择最贴近问题的选项。",
  reportDescriptionLabel: "详细描述（选填）",
  reportDescriptionPlaceholder: "补充说明、样例或上下文信息。",
  reportSubmit: "提交",
  reportSubmitting: "提交中...",
  reportCancel: "取消",
  reportErrorMessage: "暂时无法提交举报，请稍后重试。",
  reportLanguageValueEnglish: "英文",
  reportLanguageValueChinese: "中文",
  reportFlavorValueBilingual: "双语词典",
  reportFlavorValueMonolingualEnglish: "英文释义",
  reportFlavorValueMonolingualChinese: "中文释义",
  reportCategoryIncorrectMeaning: "释义错误",
  reportCategoryMissingInformation: "信息缺失或过期",
  reportCategoryInappropriateContent: "内容不当或不安全",
  reportCategoryOther: "其他",
  reportSuccess: "感谢你的守护，我们会尽快处理。",
  reportFailed: "暂时无法提交举报，请稍后重试。",
  reportUnavailable: "未能唤起举报通道，请联系客服协助处理。",
};
