import { jest } from "@jest/globals";

export const preferenceSectionsMocks = {
  useLanguage: jest.fn(),
  useUser: jest.fn(),
  useTheme: jest.fn(),
  useKeyboardShortcutContext: jest.fn(),
  useAvatarEditorWorkflow: jest.fn(),
  useUsersApi: jest.fn(),
  useProfilesApi: jest.fn(),
  useRedemptionCodesApi: jest.fn(),
  useEmailBinding: jest.fn(),
};

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: preferenceSectionsMocks.useLanguage,
  useUser: preferenceSectionsMocks.useUser,
  useTheme: preferenceSectionsMocks.useTheme,
  useKeyboardShortcutContext:
    preferenceSectionsMocks.useKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
}));

jest.unstable_mockModule("@shared/hooks/useAvatarEditorWorkflow.js", () => ({
  __esModule: true,
  default: preferenceSectionsMocks.useAvatarEditorWorkflow,
}));

jest.unstable_mockModule("@shared/hooks/useEmailBinding.js", () => ({
  __esModule: true,
  default: preferenceSectionsMocks.useEmailBinding,
  useEmailBinding: preferenceSectionsMocks.useEmailBinding,
}));

jest.unstable_mockModule("@shared/api/users.js", () => ({
  useUsersApi: preferenceSectionsMocks.useUsersApi,
}));

jest.unstable_mockModule("@shared/api/profiles.js", () => ({
  useProfilesApi: preferenceSectionsMocks.useProfilesApi,
}));

jest.unstable_mockModule("@shared/api/redemptionCodes.js", () => ({
  useRedemptionCodesApi: preferenceSectionsMocks.useRedemptionCodesApi,
}));

let cachedModules;

export const loadPreferenceSectionsModules = async () => {
  if (!cachedModules) {
    const [sectionsModule, accountConstants] = await Promise.all([
      import("../usePreferenceSections.js"),
      import("../sections/accountSection.constants.js"),
    ]);
    cachedModules = {
      usePreferenceSections: sectionsModule.default,
      ACCOUNT_USERNAME_FIELD_TYPE: accountConstants.ACCOUNT_USERNAME_FIELD_TYPE,
    };
  }

  return cachedModules;
};

const BASE_TRANSLATIONS = {
  prefTitle: "Global Preferences",
  prefDescription: "Tailor the workspace to your taste.",
  prefTablistLabel: "Preference sections",
  close: "Close",
  settingsEmptyValue: "—",
  settingsTabGeneral: "General",
  settingsGeneralDescription: "General summary",
  prefDefaultsDescription: "Defaults description",
  prefInterfaceDescription: "Interface description",
  settingsTabPersonalization: "Personalization",
  settingsPersonalizationDescription: "Personalization summary",
  prefPersonalizationTitle: "Personal Context",
  loading: "Loading...",
  settingsPersonalizationEmpty: "No personalization yet",
  settingsPersonalizationLoadError: "Unable to load personalization",
  settingsResponseStyleError: "Unable to save response style",
  settingsResponseStyleSaved: "Saved",
  responseStyleSelectLabel: "Response Tone",
  responseStyleOptionDefault: "Default",
  responseStyleOptionDefaultDescription: "Cheerful",
  responseStyleOptionCynic: "Cynic",
  responseStyleOptionCynicDescription: "Critical",
  responseStyleOptionRobot: "Robot",
  responseStyleOptionRobotDescription: "Blunt",
  responseStyleOptionListener: "Listener",
  responseStyleOptionListenerDescription: "Supportive",
  responseStyleOptionNerd: "Nerd",
  responseStyleOptionNerdDescription: "Enthusiastic",
  responseStyleFieldGoalLabel: "Personal Goals",
  responseStyleFieldGoalPlaceholder: "Goal placeholder",
  responseStyleFieldJobLabel: "Professional Role",
  responseStyleFieldJobPlaceholder: "Job placeholder",
  responseStyleFieldEducationLabel: "Education Background",
  responseStyleFieldEducationPlaceholder: "Education placeholder",
  responseStyleFieldInterestsLabel: "Interests",
  responseStyleFieldInterestsPlaceholder: "Interests placeholder",
  responseStyleFieldAbilityLabel: "Current Ability",
  responseStyleFieldAbilityPlaceholder: "Ability placeholder",
  settingsTabData: "Data controls",
  settingsDataDescription: "Data summary",
  settingsDataNotice: "Data notice",
  settingsTabKeyboard: "Keyboard shortcuts",
  settingsKeyboardDescription: "Keyboard summary",
  prefAccountTitle: "Account",
  settingsAccountDescription: "Account summary",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountEmailUnbindAction: "Unbind email",
  settingsAccountEmailUnbinding: "Removing…",
  settingsAccountPhone: "Phone",
  settingsTabAccount: "Account",
  prefKeyboardTitle: "Shortcut playbook",
  changeAvatar: "Change avatar",
  settingsAccountBindingTitle: "Connected accounts",
  settingsAccountBindingApple: "Apple",
  settingsAccountBindingGoogle: "Google",
  settingsAccountBindingWeChat: "WeChat",
  settingsAccountBindingStatusUnlinked: "Not linked",
  settingsAccountBindingActionPlaceholder: "Coming soon",
  settingsTabSubscription: "Subscription",
  subscriptionCurrentTitle: "Current plan",
  subscriptionPlanFreeTitle: "Free",
  subscriptionPlanFreeSummary: "Free summary",
  subscriptionPlanFreeCta: "Start",
  subscriptionPlanPlusTitle: "Plus",
  subscriptionPlanPlusSummary: "Plus summary",
  subscriptionPlanPlusCta: "Upgrade Plus",
  subscriptionPlanProTitle: "Pro",
  subscriptionPlanProSummary: "Pro summary",
  subscriptionPlanProCta: "Upgrade Pro",
  subscriptionPlanPremiumTitle: "Premium",
  subscriptionPlanPremiumSummary: "Premium summary",
  subscriptionPlanPremiumCta: "Unlocked",
  subscriptionSoftLimitNote: " (soft limit)",
  subscriptionValueNone: "None",
  subscriptionValueUnavailable: "Unavailable",
  subscriptionValueYes: "Yes",
  subscriptionValueNo: "No",
  subscriptionHistoryRetentionTemplate: "{value} days",
  subscriptionHistoryRetentionUnlimited: "Full",
  subscriptionSupportSloTemplate: "{value} hours",
  subscriptionFeatureWordLookupsDaily: "Lookups",
  subscriptionUnitTimesPerDay: "{value} / day",
  subscriptionFeatureAiCallsDaily: "AI",
  subscriptionFeatureTtsDaily: "TTS",
  subscriptionFeatureNotebookCapacity: "Notebook",
  subscriptionUnitItems: "{value} items",
  subscriptionFeatureAlignedLanguages: "Aligned",
  subscriptionUnitLanguages: "{value} langs",
  subscriptionFeatureOcrPages: "OCR",
  subscriptionFeaturePdfPages: "PDF",
  subscriptionUnitPagesPerMonth: "{value} pages",
  subscriptionFeatureConcurrentRequests: "Concurrent",
  subscriptionUnitConcurrent: "{value} lanes",
  subscriptionFeaturePriority: "Priority",
  subscriptionPriorityStandard: "Standard",
  subscriptionPriorityHigher: "Higher",
  subscriptionPriorityHigh: "High",
  subscriptionPriorityHighest: "Highest",
  subscriptionFeatureDevices: "Devices",
  subscriptionUnitDevices: "{value} devices",
  subscriptionFeatureAdFree: "Ad free",
  subscriptionFeatureBulkExport: "Bulk",
  subscriptionBulkExportExportOnly: "Export only",
  subscriptionBulkExportImportExport: "Import/export",
  subscriptionBulkExportImportExportApi: "Import/export + API",
  subscriptionFeatureHistoryRetention: "History",
  subscriptionFeatureBetaAccess: "Beta",
  subscriptionBetaAccessNo: "No",
  subscriptionBetaAccessApply: "Apply",
  subscriptionBetaAccessDefault: "Default",
  subscriptionBetaAccessPriority: "Priority",
  subscriptionFeatureSupportSlo: "Support",
  subscriptionPlanCurrentBadge: "Current",
  subscriptionPlanSelectedBadge: "Selected",
  subscriptionPlanLockedBadge: "Locked",
  subscriptionPlanFreePrice: "Free",
  subscriptionPriceMonthly: "{amount}/m",
  subscriptionPriceYearly: "{amount}/y",
  subscriptionPriceYearlyWithEquivalent: "{amount} ({equivalent}/m)",
  subscriptionBillingCycleMonthly: "Monthly",
  subscriptionBillingCycleYearly: "Yearly",
  subscriptionNextRenewalTemplate: "Next: {value}",
  subscriptionRegionLineTemplate: "Region: {value}",
  subscriptionPremiumHighlight: "Premium highlight",
  subscriptionActionManage: "Manage",
  subscriptionActionUpgrade: "Upgrade",
  subscriptionActionDowngrade: "Downgrade",
  subscriptionActionChangeRegion: "Change region",
  subscriptionActionRedeem: "Redeem",
  subscriptionRedeemTitle: "Redeem",
  subscriptionRedeemPlaceholder: "Code",
  subscriptionRedeemButton: "Redeem now",
  subscriptionRedeemSuccessToast: "Redeemed successfully",
  subscriptionRedeemFailureToast: "Redeem failed. Try again.",
  subscriptionFeatureColumnLabel: "Feature",
  pricingFixedNote: "Fixed",
  pricingTaxIncluded: "Tax included",
  pricingTaxExcluded: "Tax excluded",
  usernamePlaceholder: "Enter username",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  saving: "Saving...",
  usernameValidationEmpty: "Username cannot be empty",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateFailed: "Unable to update username",
  toastDismissLabel: "Dismiss notification",
};

export const createTranslations = (overrides = {}) => ({
  ...BASE_TRANSLATIONS,
  ...overrides,
});

const createDefaultUser = () => ({
  id: "user-1",
  username: "amy",
  email: "amy@example.com",
  plan: "plus",
  isPro: true,
  token: "token-123",
});

const createDefaultThemeContext = () => ({
  theme: "light",
  setTheme: jest.fn(),
});

const createDefaultKeyboardContext = () => ({
  register: jest.fn(),
  unregister: jest.fn(),
});

const createDefaultAvatarWorkflow = () => ({
  selectAvatar: jest.fn(),
  modalProps: {
    open: false,
    source: "",
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    labels: {},
    isProcessing: false,
  },
  isBusy: false,
});

const createDefaultProfile = () => ({
  job: "Engineer",
  goal: "B2",
  currentAbility: "B1",
  education: "Bachelor",
  interest: "AI",
  responseStyle: "default",
  customSections: [],
});

const createDefaultEmailBinding = (unbindEmail) => ({
  mode: "idle",
  startEditing: jest.fn(),
  cancelEditing: jest.fn(),
  requestCode: jest.fn(),
  confirmChange: jest.fn(),
  unbindEmail,
  isSendingCode: false,
  isVerifying: false,
  isUnbinding: false,
  codeIssuedAt: null,
  lastRequestedEmail: null,
  requestedEmail: null,
  hasBoundEmail: true,
});

const mergeOverrides = (base, overrides) => {
  if (!overrides) {
    return base;
  }

  if (typeof overrides === "function") {
    return overrides(base);
  }

  return {
    ...base,
    ...overrides,
  };
};

const resetPreferenceSectionMocks = () => {
  Object.values(preferenceSectionsMocks).forEach((mockFn) => {
    mockFn.mockReset();
  });
};

/**
 * 意图：生成偏好设置页面 Hook 的测试上下文，包括默认 mock 返回值与可选覆盖项。
 * 输入：options.translationOverrides、options.user、options.themeContext 等可选覆盖参数。
 * 输出：包含翻译、mock 引用与 restore 方法的上下文对象。
 * 流程：
 *  1) 重置已登记的 mock；
 *  2) 组合默认值与覆写配置；
 *  3) 返回便于断言的上下文引用。
 * 错误处理：
 *  - 控制台错误通过 spyOn 拦截，调用 restore 即可回滚。
 * 复杂度：
 *  - O(1) 构建；仅创建固定数量的 mock 对象。
 */
export const createPreferenceSectionsTestContext = (options = {}) => {
  resetPreferenceSectionMocks();

  const translations = createTranslations(options.translationOverrides);
  preferenceSectionsMocks.useLanguage.mockReturnValue({ t: translations });

  const user = mergeOverrides(createDefaultUser(), options.user);
  const setUserMock = jest.fn();
  preferenceSectionsMocks.useUser.mockReturnValue({
    user,
    setUser: setUserMock,
    ...options.useUserResultOverrides,
  });

  const themeContext = mergeOverrides(
    createDefaultThemeContext(),
    options.themeContext,
  );
  preferenceSectionsMocks.useTheme.mockReturnValue(themeContext);

  const keyboardContext = mergeOverrides(
    createDefaultKeyboardContext(),
    options.keyboardShortcutsContext,
  );
  preferenceSectionsMocks.useKeyboardShortcutContext.mockReturnValue(
    keyboardContext,
  );

  const avatarWorkflow = mergeOverrides(
    createDefaultAvatarWorkflow(),
    options.avatarWorkflow,
  );
  preferenceSectionsMocks.useAvatarEditorWorkflow.mockReturnValue(
    avatarWorkflow,
  );

  const unbindEmailMock =
    options.unbindEmailMock ?? jest.fn().mockResolvedValue({ email: null });

  const emailBindingState = mergeOverrides(
    createDefaultEmailBinding(unbindEmailMock),
    options.emailBinding,
  );
  preferenceSectionsMocks.useEmailBinding.mockReturnValue(emailBindingState);

  const profileSnapshot = mergeOverrides(
    createDefaultProfile(),
    options.profileResponse,
  );
  const fetchProfileMock =
    options.fetchProfileMock ?? jest.fn().mockResolvedValue(profileSnapshot);
  const saveProfileMock =
    options.saveProfileMock ?? jest.fn().mockResolvedValue(profileSnapshot);
  preferenceSectionsMocks.useProfilesApi.mockReturnValue({
    fetchProfile: fetchProfileMock,
    saveProfile: saveProfileMock,
    ...options.profilesApiOverrides,
  });

  const redeemMock = options.redeemMock ?? jest.fn().mockResolvedValue({});
  preferenceSectionsMocks.useRedemptionCodesApi.mockReturnValue({
    redeem: redeemMock,
    ...options.redemptionCodesApiOverrides,
  });

  const updateUsernameMock =
    options.updateUsernameMock ??
    jest.fn().mockResolvedValue({ username: user.username });
  preferenceSectionsMocks.useUsersApi.mockReturnValue({
    updateUsername: updateUsernameMock,
    unbindEmail: unbindEmailMock,
    ...options.usersApiOverrides,
  });

  const consoleErrorStub = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  return {
    translations,
    user,
    setUserMock,
    updateUsernameMock,
    fetchProfileMock,
    saveProfileMock,
    redeemMock,
    unbindEmailMock,
    emailBindingState,
    avatarWorkflow,
    consoleErrorStub,
    restore: () => {
      consoleErrorStub.mockRestore();
    },
  };
};
