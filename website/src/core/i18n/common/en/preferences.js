/**
 * 背景：
 *  - 偏好设置、个性化与数据管理词条原与其他功能杂糅在单文件中，缺乏可维护边界。
 * 目的：
 *  - 集中维护偏好相关的翻译，支持界面模块化演进与未来多语言扩展。
 * 关键决策与取舍：
 *  - 以职能分层拆分词条文件，保持纯数据结构，避免引入运行时依赖；
 *  - 维持键名不变以确保现有调用兼容。
 * 影响范围：
 *  - 偏好设置页面及其复用组件。
 * 演进与TODO：
 *  - 后续可考虑按子标签（如数据、账户）再细分文件以贴合六边形架构端口划分。
 */
const preferences = {
  prefTitle: "Preferences",
  prefDescription:
    "Tailor Glancy's languages, voices, and ambience to suit every session.",
  prefDefaultsTitle: "Default languages",
  prefDefaultsDescription:
    "Choose the source and target languages Glancy prepares whenever you arrive.",
  prefInterfaceTitle: "Interface experience",
  prefInterfaceDescription:
    "Adjust how the interface speaks and presents itself across sessions.",
  prefVoicesTitle: "Pronunciation",
  prefVoicesDescription:
    "Select the studio voices that narrate English and Chinese entries.",
  prefPersonalizationTitle: "Personal Context",
  prefKeyboardTitle: "Shortcut playbook",
  prefDataTitle: "Data stewardship",
  prefAccountTitle: "Account",
  prefSystemLanguage: "System Language",
  prefSystemLanguageAuto: "Match Device Language",
  prefLanguage: "Source Language",
  prefSearchLanguage: "Target Language",
  prefDictionaryModel: "Default Model",
  prefVoiceEn: "English Voice",
  prefVoiceZh: "Chinese Voice",
  prefTheme: "Theme",
  settingsVoicePreviewPlay: "Play",
  settingsVoicePreviewStop: "Stop",
  settingsVoicePreviewTextEn: "Hi, I'm Glancy.",
  settingsVoicePreviewTextZh: "你好，我是 Glancy。",
  settingsTabGeneral: "General",
  settingsGeneralDescription:
    "Tune interface languages, theme, and pronunciation defaults.",
  settingsGeneralThemeLabel: "Theme",
  settingsGeneralThemeLight: "Light",
  settingsGeneralThemeDark: "Dark",
  settingsGeneralThemeSystem: "System",
  settingsGeneralLanguageLabel: "Interface language",
  settingsGeneralLanguageOption_en: "English (US)",
  settingsGeneralLanguageOption_zh: "Chinese (Simplified)",
  settingsGeneralMarkdownLabel: "Markdown rendering",
  settingsGeneralMarkdownDynamic: "Render dynamically",
  settingsGeneralMarkdownPlain: "Show raw text",
  settingsGeneralChatOutputLabel: "Chat response",
  settingsGeneralChatOutputStream: "Stream responses",
  settingsGeneralChatOutputSync: "Send when ready",
  settingsTabPersonalization: "Personalization",
  settingsPersonalizationDescription:
    "Describe your background so answers feel bespoke.",
  loading: "Loading...",
  settingsPersonalizationEmpty:
    "Add a few notes about yourself to tailor every response.",
  settingsPersonalizationLoadError:
    "We couldn't load your personalization details. Please try again shortly.",
  settingsResponseStyleError:
    "We couldn't save your response style. Please try again in a moment.",
  settingsResponseStyleSaved: "Saved",
  responseStyleSelectLabel: "Response Tone",
  responseStyleOptionDefault: "Default",
  responseStyleOptionDefaultDescription: "Cheerful and adaptive",
  responseStyleOptionCynic: "Cynic",
  responseStyleOptionCynicDescription: "Critical with a dry wit",
  responseStyleOptionRobot: "Robot",
  responseStyleOptionRobotDescription: "Efficient and straight to the point",
  responseStyleOptionListener: "Listener",
  responseStyleOptionListenerDescription: "Supportive and reflective",
  responseStyleOptionNerd: "Nerd",
  responseStyleOptionNerdDescription: "Curious and exploratory",
  responseStyleFieldGoalLabel: "Personal Goals",
  responseStyleFieldGoalPlaceholder: "e.g. Reach TOEFL 110 within 6 months",
  responseStyleFieldJobLabel: "Professional Role",
  responseStyleFieldJobPlaceholder: "e.g. Product manager or language coach",
  responseStyleFieldEducationLabel: "Education Background",
  responseStyleFieldEducationPlaceholder:
    "e.g. BA in Linguistics, Peking University",
  responseStyleFieldInterestsLabel: "Interests",
  responseStyleFieldInterestsPlaceholder:
    "List interests or focus areas on separate lines",
  responseStyleFieldAbilityLabel: "Current Ability",
  responseStyleFieldAbilityPlaceholder: "e.g. CEFR B2",
  settingsEnableCustomization: "Enable customization",
  settingsOccupation: "Occupation",
  settingsOccupationPlaceholder: "e.g. Student",
  settingsAboutYou: "More about you",
  settingsAboutYouPlaceholder: "Share your expertise, interests, or context.",
  settingsLearningGoal: "Learning goal",
  settingsLearningGoalPlaceholder: "Tell us the outcome you're aiming for.",
  settingsTabKeyboard: "Keyboard shortcuts",
  settingsKeyboardDescription:
    "Master Glancy with a curated set of command keys.",
  settingsKeyboardHint: "Click a shortcut then press keys to update.",
  settingsKeyboardRecordingHint:
    "Recording… press the new combination or Esc to cancel.",
  settingsKeyboardRecording: "Press keys",
  settingsKeyboardSaving: "Saving…",
  settingsKeyboardReset: "Restore defaults",
  settingsKeyboardOpenPalette: "Open shortcut guide",
  settingsKeyboardEditLabel: "Edit shortcut for {label}",
  settingsKeyboardConflict: "Shortcut already in use.",
  shortcutSearch: "Global search",
  shortcutSend: "Send current message",
  shortcutEdit: "Edit last message",
  shortcutDismiss: "Close modal or menu",
  settingsTabData: "Data controls",
  settingsDataDescription:
    "Manage how Glancy stores and purges your historical traces.",
  settingsDataNotice:
    "Export and deletion workflows are coming soon. Our concierge team can assist via support@glancy.ai.",
  settingsDataHistoryToggleLabel: "History collection",
  settingsDataHistoryToggleDescription:
    "When enabled, new lookups are stored locally and in your account history for quick recall.",
  settingsDataHistoryToggleOn: "Capture history",
  settingsDataHistoryToggleOff: "Pause history",
  settingsDataRetentionLabel: "Retention window",
  settingsDataRetentionDescription:
    "Choose how long Glancy keeps search records before pruning older entries.",
  settingsDataRetentionOption_30d: "30 days",
  settingsDataRetentionOption_90d: "90 days",
  settingsDataRetentionOption_365d: "365 days",
  settingsDataRetentionOption_forever: "Keep forever",
  settingsDataLanguageLabel: "Language history",
  settingsDataLanguageDescription:
    "Only clears saved lookups for the selected language.",
  settingsDataClearLanguagePlaceholder: "No language-specific history yet",
  settingsDataActionsLabel: "Data actions",
  settingsDataClearAll: "Erase all history",
  settingsDataClearLanguage: "Clear selected language",
  settingsDataExport: "Export data",
  settingsDataExportDescription:
    "Export detailed definitions for every word in your history, grouped by chapter.",
  settingsDataExportFileName: "glancy-data-export",
  settingsDataExportDefaultChapter: "General",
  settingsDataExportChapterColumn: "chapter",
  settingsDataExportContentColumn: "content",
  settingsExportData: "Export data",
  settingsEraseHistory: "Erase history",
  settingsTabAccount: "Account",
  settingsAccountDescription:
    "Review and safeguard the basics that identify you in Glancy.",
  settingsAccountAvatarLabel: "Avatar",
  settingsManageProfile: "Manage profile",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountEmailUnbindAction: "Unlink email",
  settingsAccountEmailUnbinding: "Removing…",
  settingsAccountPhoneRebindAction: "Change phone",
  settingsEmptyValue: "Not set",
  settingsAccountBindingTitle: "Connected accounts",
  settingsAccountBindingApple: "Apple",
  settingsAccountBindingGoogle: "Google",
  settingsAccountBindingWeChat: "WeChat",
  settingsAccountBindingStatusUnlinked: "Not linked",
  settingsAccountBindingActionPlaceholder: "Coming soon",
  saving: "Saving...",
  saveButton: "Save changes",
  saveSuccess: "Preferences updated",
};

export default preferences;
