/**
 * 背景：
 *  - 数据策略相关文案需独立演进，以支持更复杂的导出与留存功能。
 * 目的：
 *  - 收敛数据存储、导出与清理相关的翻译项，便于跨团队协作。
 * 关键决策与取舍：
 *  - 继续使用平铺键，避免现有调用链路变更；
 *  - 将导出按钮等操作项一起纳入，保持语义聚合。
 * 影响范围：
 *  - 偏好设置“数据控制”页签及相关操作提示。
 * 演进与TODO：
 *  - 若增加多格式导出，可在此扩展枚举型配置。
 */
export const SETTINGS_DATA_TRANSLATIONS_ZH = {
  settingsTabData: "数据控制",
  settingsDataDescription: "集中管理历史记录与数据导出的留存策略。",
  settingsDataNotice:
    "导出与清除功能即将上线，现可通过 support@glancy.ai 联系顾问协助办理。",
  settingsDataHistoryToggleLabel: "历史记录采集",
  settingsDataHistoryToggleDescription:
    "开启后会将新的查询保存到本地与账号历史，方便快速回顾。",
  settingsDataHistoryToggleOn: "开启采集",
  settingsDataHistoryToggleOff: "暂停采集",
  settingsDataRetentionLabel: "保留时长",
  settingsDataRetentionDescription: "指定历史记录在自动清理前的留存时间。",
  settingsDataRetentionOption_30d: "30 天",
  settingsDataRetentionOption_90d: "90 天",
  settingsDataRetentionOption_365d: "365 天",
  settingsDataRetentionOption_forever: "永久保留",
  settingsDataLanguageLabel: "按语言清理",
  settingsDataLanguageDescription:
    "仅删除所选语言的查询历史，不影响其他语种的留存。",
  settingsDataClearLanguagePlaceholder: "暂无按语言分类的历史记录",
  settingsDataActionsLabel: "数据操作",
  settingsDataClearAll: "清空全部历史",
  settingsDataClearLanguage: "清空所选语言",
  settingsDataExport: "导出数据",
  settingsDataExportDescription:
    "导出历史里所有单词的详细释义，并按章节分类存储到单元格。",
  settingsDataExportFileName: "glancy-data-export",
  settingsDataExportDefaultChapter: "通用",
  settingsDataExportChapterColumn: "章节",
  settingsDataExportContentColumn: "内容",
  settingsExportData: "导出数据",
  settingsEraseHistory: "清除历史",
};
