import { jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockUseLanguage = jest.fn();
const mockUseUser = jest.fn();
const mockUseTheme = jest.fn();
const mockUseKeyboardShortcutContext = jest.fn();
const mockUseAvatarEditorWorkflow = jest.fn();
const mockUseUsersApi = jest.fn();
const mockUseProfilesApi = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useLanguage: mockUseLanguage,
  useUser: mockUseUser,
  useTheme: mockUseTheme,
  useKeyboardShortcutContext: mockUseKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
}));

jest.unstable_mockModule("@/hooks/useAvatarEditorWorkflow.js", () => ({
  __esModule: true,
  default: mockUseAvatarEditorWorkflow,
}));

jest.unstable_mockModule("@/api/users.js", () => ({
  useUsersApi: mockUseUsersApi,
}));

jest.unstable_mockModule("@/api/profiles.js", () => ({
  useProfilesApi: mockUseProfilesApi,
}));

let usePreferenceSections;
let translations;
let fetchProfileMock;
let consoleErrorStub;

beforeAll(async () => {
  ({ default: usePreferenceSections } = await import(
    "../usePreferenceSections.js"
  ));
});

const createTranslations = (overrides = {}) => ({
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
  prefPersonalizationTitle: "Personal context",
  loading: "Loading...",
  settingsPersonalizationEmpty: "No personalization yet",
  settingsPersonalizationLoadError: "Unable to load personalization",
  settingsTabData: "Data controls",
  settingsDataDescription: "Data summary",
  settingsDataNotice: "Data notice",
  settingsTabKeyboard: "Keyboard shortcuts",
  settingsKeyboardDescription: "Keyboard summary",
  prefAccountTitle: "Account",
  settingsAccountDescription: "Account summary",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
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
  ...overrides,
});

beforeEach(() => {
  mockUseLanguage.mockReset();
  mockUseUser.mockReset();
  mockUseTheme.mockReset();
  mockUseKeyboardShortcutContext.mockReset();
  mockUseAvatarEditorWorkflow.mockReset();
  mockUseUsersApi.mockReset();
  mockUseProfilesApi.mockReset();
  consoleErrorStub = jest.spyOn(console, "error").mockImplementation(() => {});
  translations = createTranslations();
  mockUseLanguage.mockReturnValue({ t: translations });
  mockUseUser.mockReturnValue({
    user: {
      id: "user-1",
      username: "amy",
      email: "amy@example.com",
      plan: "plus",
      isPro: true,
      token: "token-123",
    },
    setUser: jest.fn(),
  });
  mockUseTheme.mockReturnValue({ theme: "light", setTheme: jest.fn() });
  mockUseKeyboardShortcutContext.mockReturnValue({
    register: jest.fn(),
    unregister: jest.fn(),
  });
  mockUseAvatarEditorWorkflow.mockReturnValue({
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
  mockUseUsersApi.mockReturnValue({
    updateUsername: jest.fn().mockResolvedValue({ username: "amy" }),
  });
  fetchProfileMock = jest.fn().mockResolvedValue({
    job: "Engineer",
    goal: "B2",
    currentAbility: "B1",
    education: "Bachelor",
    interest: "AI",
    customSections: [],
  });
  mockUseProfilesApi.mockReturnValue({ fetchProfile: fetchProfileMock });
});

afterEach(() => {
  if (consoleErrorStub) {
    consoleErrorStub.mockRestore();
  }
});

/**
 * 测试目标：默认渲染时分区顺序应为 general→personalization→data→keyboard→account，且默认激活 general。
 * 前置条件：使用默认语言文案与账户信息渲染 Hook。
 * 步骤：
 *  1) 渲染 usePreferenceSections。
 *  2) 读取 sections 与 panel 结构。
 * 断言：
 *  - sections 顺序符合蓝图。
 *  - activeSectionId 为 general。
 *  - focusHeadingId 与 headingId 指向 general 分区。
 *  - modalHeadingText 等于 General 文案。
 * 边界/异常：
 *  - 若 general 被禁用，应回退到下一个可用分区（由 sanitizeActiveSectionId 覆盖）。
 */
test(
  "Given default sections When reading blueprint Then general leads navigation",
  async () => {
    const { result } = renderHook(() =>
      usePreferenceSections({
        initialSectionId: undefined,
      }),
    );

    await waitFor(() => {
      expect(fetchProfileMock).toHaveBeenCalledWith({ token: "token-123" });
    });

    await waitFor(() => {
      const personalizationSection = result.current.sections.find(
        (section) => section.id === "personalization",
      );
      expect(personalizationSection.componentProps.state.status).toBe("ready");
    });

    expect(result.current.sections.map((section) => section.id)).toEqual([
      "general",
      "personalization",
      "data",
      "keyboard",
      "account",
      "subscription",
    ]);
    expect(result.current.activeSectionId).toBe("general");
    expect(result.current.panel.headingId).toBe("general-section-heading");
    expect(result.current.panel.focusHeadingId).toBe("general-section-heading");
    expect(result.current.panel.modalHeadingId).toBe(
      "settings-modal-fallback-heading",
    );
    expect(result.current.panel.modalHeadingText).toBe("General");
    const accountSection = result.current.sections.find(
      (section) => section.id === "account",
    );
    expect(accountSection).toBeDefined();
    expect(accountSection.Component).toBeDefined();
    expect(accountSection.componentProps.identity.displayName).toBe("amy");
    expect(accountSection.componentProps.identity.changeLabel).toBe(
      translations.changeAvatar,
    );
    expect(accountSection.componentProps.identity.avatarAlt).toBe(
      translations.prefAccountTitle,
    );
    expect(typeof accountSection.componentProps.identity.onSelectAvatar).toBe(
      "function",
    );
    expect(accountSection.componentProps.identity.isUploading).toBe(false);
    expect(
      typeof accountSection.componentProps.fields[0].renderValue,
    ).toBe("function");
    expect(accountSection.componentProps.bindings.title).toBe(
      translations.settingsAccountBindingTitle,
    );
    expect(accountSection.componentProps.bindings.items).toHaveLength(3);
    expect(
      accountSection.componentProps.bindings.items.map((item) => item.name),
    ).toEqual([
      translations.settingsAccountBindingApple,
      translations.settingsAccountBindingGoogle,
      translations.settingsAccountBindingWeChat,
    ]);
    expect(
      accountSection.componentProps.bindings.items.every(
        (item) =>
          item.status === translations.settingsAccountBindingStatusUnlinked &&
          item.actionLabel ===
            translations.settingsAccountBindingActionPlaceholder,
      ),
    ).toBe(true);
    expect(result.current.avatarEditor).toBeDefined();
    expect(typeof result.current.avatarEditor.modalProps.onConfirm).toBe(
      "function",
    );
    expect(result.current.avatarEditor.modalProps.open).toBe(false);
    const subscriptionSection = result.current.sections.find(
      (section) => section.id === "subscription",
    );
    expect(subscriptionSection).toBeDefined();
    expect(subscriptionSection.Component).toBeDefined();
    expect(subscriptionSection.componentProps.planCards).toHaveLength(3);
    expect(
      subscriptionSection.componentProps.planCards.some(
        (card) => card.id === "PLUS" && card.state === "current",
      ),
    ).toBe(true);
    const personalizationSection = result.current.sections.find(
      (section) => section.id === "personalization",
    );
    expect(personalizationSection.componentProps.copy.emptyLabel).toBe(
      translations.settingsPersonalizationEmpty,
    );
    expect(
      personalizationSection.componentProps.state.snapshot.summary.includes(
        "Engineer",
      ),
    ).toBe(true);
  },
);

/**
 * 测试目标：画像请求失败后暴露 error 状态并可通过 onRetry 重试。
 * 前置条件：首次请求抛出异常。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 等待状态变为 error；
 *  3) 调用 onRetry；
 * 断言：
 *  - onRetry 触发后再次调用 fetchProfile；
 *  - 状态最终回到 ready。
 * 边界/异常：
 *  - 若重试未恢复则断言失败。
 */
test(
  "Given personalization fetch fails When retry invoked Then status recovers",
  async () => {
    fetchProfileMock
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        job: "Writer",
        goal: "C1",
        currentAbility: "B2",
        education: "Master",
        interest: "Literature",
        customSections: [],
      });

    const { result } = renderHook(() =>
      usePreferenceSections({ initialSectionId: undefined }),
    );

    await waitFor(() => {
      const personalizationSection = result.current.sections.find(
        (section) => section.id === "personalization",
      );
      expect(personalizationSection.componentProps.state.status).toBe("error");
    });

    await act(async () => {
      const personalizationSection = result.current.sections.find(
        (section) => section.id === "personalization",
      );
      await personalizationSection.componentProps.onRetry();
    });

    await waitFor(() => {
      const personalizationSection = result.current.sections.find(
        (section) => section.id === "personalization",
      );
      expect(personalizationSection.componentProps.state.status).toBe("ready");
    });

    expect(fetchProfileMock).toHaveBeenCalledTimes(2);
  },
);

/**
 * 测试目标：当用户仅暴露 member 标记时，订阅蓝图应回退到 PLUS 套餐。
 * 前置条件：用户缺少 plan 字段但 member 为 true。
 * 步骤：
 *  1) 重置 useUser mock 仅返回 member；
 *  2) 渲染 Hook 并获取订阅分区；
 * 断言：
 *  - 当前套餐牌面为 PLUS；
 *  - planCards 中 PLUS 状态为 current。
 * 边界/异常：
 *  - 若未来提供更细颗粒度的 tier 字段，应优先使用新字段。
 */
test("Given member flag only When mapping subscription plan Then membership fallback resolves to paid plan", () => {
  mockUseUser.mockReturnValue({
    user: {
      username: "amy",
      email: "amy@example.com",
      member: true,
    },
  });

  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  const subscriptionSection = result.current.sections.find(
    (section) => section.id === "subscription",
  );

  expect(subscriptionSection).toBeDefined();
  expect(subscriptionSection.componentProps.defaultSelectedPlanId).toBe("PLUS");
  const plusCard = subscriptionSection.componentProps.planCards.find(
    (card) => card.id === "PLUS",
  );
  expect(plusCard).toBeDefined();
  expect(plusCard.state).toBe("current");
});

/**
 * 测试目标：当传入历史分区 ID 时，应回退至首个可用分区以维持导航可用性。
 * 前置条件：initialSectionId 指向已下线的 privacy 分区。
 * 步骤：
 *  1) 渲染 usePreferenceSections 并读取激活分区。
 * 断言：
 *  - activeSectionId 回退为 general。
 *  - panel.headingId 对应 general 分区。
 * 边界/异常：
 *  - 若 general 被禁用，应回退到下一个可用分区（由 sanitizeActiveSectionId 负责）。
 */
test("Given legacy section id When initializing Then selection falls back to general", () => {
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: "privacy",
    }),
  );

  expect(result.current.activeSectionId).toBe("general");
  expect(result.current.panel.headingId).toBe("general-section-heading");
});

/**
 * 测试目标：当分区标题文案为空白时，模态备用标题应回退至 copy.title。
 * 前置条件：快捷键分区标题与摘要均为空白字符串。
 * 步骤：
 *  1) 使用覆盖文案的语言包渲染 Hook，并指定初始分区为 keyboard。
 *  2) 读取 panel 对象中的标题字段。
 * 断言：
 *  - modalHeadingText 等于 copy.title。
 *  - focusHeadingId 指向 keyboard 分区 heading。
 * 边界/异常：
 *  - 若 copy.title 为空，也应保持非空字符串（由 Hook 内默认值保障）。
 */
test("Given blank section titles When resolving modal heading Then fallback title is used", () => {
  translations = createTranslations({
    settingsTabKeyboard: "   ",
    settingsKeyboardDescription: "   ",
  });
  mockUseLanguage.mockReturnValue({
    t: translations,
  });

  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: "keyboard",
    }),
  );

  expect(result.current.panel.focusHeadingId).toBe("keyboard-section-heading");
  expect(result.current.panel.modalHeadingText).toBe(result.current.copy.title);
  expect(result.current.panel.modalHeadingId).toBe(
    "settings-modal-fallback-heading",
  );
});

/**
 * 测试目标：当键盘分区未提供描述时，应移除面板描述语义以避免空引用。
 * 前置条件：使用默认翻译渲染 Hook，并激活 keyboard 分区。
 * 步骤：
 *  1) 指定 initialSectionId 为 keyboard 渲染 Hook；
 * 断言：
 *  - activeSection 不再暴露 message 属性；
 *  - panel.descriptionId 为 undefined。
 * 边界/异常：
 *  - 若未来恢复描述，应同步更新该断言。
 */
test("Given keyboard section without summary When rendering Then panel description id clears", () => {
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: "keyboard",
    }),
  );

  expect(result.current.activeSection?.componentProps?.message).toBeUndefined();
  expect(result.current.panel.descriptionId).toBeUndefined();
});

/**
 * 测试目标：切换分区后备用标题随激活分区更新。
 * 前置条件：默认激活 general 分区。
 * 步骤：
 *  1) 渲染 Hook 并调用 handleSectionSelect 选择 data 分区。
 *  2) 读取 panel 的标题字段。
 * 断言：
 *  - modalHeadingText 更新为 Data controls 文案。
 *  - focusHeadingId 更新为 data-section-heading。
 * 边界/异常：
 *  - 若分区被禁用，handleSectionSelect 应忽略状态变更（此处不触发）。
 */
test("Given section switch When selecting data Then heading metadata updates", async () => {
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  act(() => {
    result.current.handleSectionSelect({ id: "data", disabled: false });
  });

  expect(result.current.activeSectionId).toBe("data");

  await waitFor(() => {
    expect(result.current.panel.focusHeadingId).toBe("data-section-heading");
    expect(result.current.panel.modalHeadingText).toBe("Data controls");
  });
});
