import { jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockUseLanguage = jest.fn();
const mockUseUser = jest.fn();
const mockUseApi = jest.fn();
const mockUseTheme = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useLanguage: mockUseLanguage,
  useUser: mockUseUser,
  useTheme: mockUseTheme,
}));

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: mockUseApi,
}));

let usePreferenceSections;

beforeAll(async () => {
  ({ default: usePreferenceSections } = await import("../usePreferenceSections.js"));
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
  settingsAccountAge: "Age",
  settingsAccountGender: "Gender",
  settingsTabAccount: "Account",
  settingsTabSubscription: "Subscription",
  settingsSubscriptionDescription: "Manage subscription plans.",
  "plan.free.title": "FREE",
  "plan.plus.title": "PLUS",
  "plan.pro.title": "PRO",
  "plan.premium.title": "PREMIUM",
  "plan.free.desc": "Free tier",
  "plan.plus.desc": "Plus tier",
  "plan.pro.desc": "Pro tier",
  "plan.premium.desc": "Premium tier",
  "subscription.plan.free.cta": "Start",
  "subscription.plan.plus.cta": "Upgrade",
  "subscription.plan.pro.cta": "Upgrade",
  "subscription.plan.premium.cta": "Unlocked",
  subscriptionPlanCurrent: "Current",
  subscriptionPriceMonthly: "{{value}}/mo",
  subscriptionPriceYearly: "{{value}}/yr",
  subscriptionPriceYearlyEquivalent: "≈ {{value}}/mo",
  subscriptionPriceFree: "Free",
  subscriptionMatrixTitle: "Plans",
  subscriptionMatrixFeature: "Feature",
  subscriptionRedeemTitle: "Redeem",
  subscriptionRedeemPlaceholder: "Enter code",
  subscriptionRedeemSubmit: "Redeem",
  subscriptionSubscribeTitle: "Subscribe",
  subscriptionSubscribeCta: "Go",
  subscriptionSubscribeDisabled: "Already selected",
  subscriptionFaqTitle: "FAQ",
  subscriptionFaqFixed: "Pricing fixed.",
  subscriptionFaqTaxIncluded: "Tax included.",
  subscriptionFaqTaxExcluded: "Tax excluded.",
  subscriptionFaqAutoRenew: "Auto renew.",
  subscriptionFaqInvoice: "Invoice available.",
  subscriptionFaqRefund: "Refund within {{days}} days.",
  subscriptionFaqSupport: "Support.",
  subscriptionCurrentHeadline: "{{plan}} · {{cycle}}",
  subscriptionCurrentCycleFallback: "Monthly",
  subscriptionMetaBillingCycle: "Cycle",
  subscriptionMetaNextRenewalLabel: "Next",
  subscriptionMetaRegionLabel: "Region",
  subscriptionMetaCurrencyLabel: "Currency",
  subscriptionMetaValidityLabel: "Validity",
  subscriptionMetaNextRenewal: "Next: {{date}}",
  subscriptionMetaNextRenewalPending: "Next: pending",
  subscriptionMetaRegion: "Region: {{region}}",
  subscriptionMetaCurrency: "Currency: {{currency}}",
  subscriptionMetaValidUntil: "Valid until {{date}}",
  subscriptionMetaValidUnlimited: "Unlimited",
  subscriptionPremiumHighlight: "Premium active.",
  subscriptionActionManage: "Manage",
  subscriptionActionChangeRegion: "Change region",
  subscriptionActionRedeem: "Redeem",
  "subscription.feature.wordLookupsDaily": "Lookups",
  "subscription.feature.llmCallsDaily": "AI",
  "subscription.feature.ttsDaily": "TTS",
  "subscription.feature.vocabularySize": "Notebook",
  "subscription.feature.bilingualExamples": "Languages",
  "subscription.feature.ocrMonthly": "OCR",
  "subscription.feature.pdfMonthly": "PDF",
  "subscription.feature.concurrency": "Concurrency",
  "subscription.feature.priority": "Priority",
  "subscription.feature.devices": "Devices",
  "subscription.feature.ads": "Ads",
  "subscription.feature.dataTools": "Data tools",
  "subscription.feature.historyRetention": "History",
  "subscription.feature.beta": "Beta",
  "subscription.feature.support": "Support",
  subscriptionValuePerDay: "{{value}}/day",
  subscriptionValuePerMonth: "{{value}}/month",
  subscriptionValueSoftLimit: " (soft)",
  subscriptionValueLanguages: "{{value}} languages",
  subscriptionValueSupport: "{{value}} h",
  subscriptionValueNone: "None",
  subscriptionValueUnavailable: "—",
  "subscription.priority.standard": "Standard",
  "subscription.priority.elevated": "Elevated",
  "subscription.priority.high": "High",
  "subscription.priority.highest": "Highest",
  "subscription.boolean.yes": "Yes",
  "subscription.boolean.no": "No",
  "subscription.datatools.exportOnly": "Export only",
  "subscription.datatools.importExport": "Import & export",
  "subscription.datatools.importExportApi": "Import/export + API",
  "subscription.history.days": "{{value}} days",
  "subscription.history.year": "{{value}} year",
  "subscription.history.unlimited": "Unlimited",
  "subscription.beta.none": "No",
  "subscription.beta.optin": "Opt-in",
  "subscription.beta.default": "Default",
  "subscription.beta.priority": "Priority",
  prefKeyboardTitle: "Shortcut playbook",
  settingsManageProfile: "Manage profile",
  ...overrides,
});

beforeEach(() => {
  mockUseLanguage.mockReset();
  mockUseUser.mockReset();
  mockUseApi.mockReset();
  mockUseTheme.mockReset();
  mockUseLanguage.mockReturnValue({ t: createTranslations(), lang: "en" });
  mockUseUser.mockReturnValue({
    user: { username: "amy", email: "amy@example.com", plan: "plus", isPro: true },
  });
  mockUseApi.mockReturnValue(null);
  mockUseTheme.mockReturnValue({});
});

/**
 * 测试目标：默认渲染时分区顺序应为 subscription→general→personalization→data→keyboard→account，且默认激活 subscription。
 * 前置条件：使用默认语言文案与账户信息渲染 Hook。
 * 步骤：
 *  1) 渲染 usePreferenceSections。
 *  2) 读取 sections 与 panel 结构。
 * 断言：
 *  - sections 顺序符合蓝图。
 *  - activeSectionId 为 subscription。
 *  - focusHeadingId 与 headingId 指向 subscription 分区。
 *  - modalHeadingText 等于 Subscription 文案。
 * 边界/异常：
 *  - 若 subscription 被禁用，应回退到下一个可用分区（由 sanitizeActiveSectionId 覆盖）。
 */
test(
  "Given default sections When reading blueprint Then subscription leads navigation",
  () => {
    const { result } = renderHook(() =>
      usePreferenceSections({ initialSectionId: undefined, onOpenAccountManager: jest.fn() }),
    );

    expect(result.current.sections.map((section) => section.id)).toEqual([
      "subscription",
      "general",
      "personalization",
      "data",
      "keyboard",
      "account",
    ]);
    expect(
      result.current.sections.every(
        (section) => !Object.prototype.hasOwnProperty.call(section, "summary"),
      ),
    ).toBe(true);
    expect(result.current.activeSectionId).toBe("subscription");
    expect(result.current.panel.headingId).toBe("subscription-section-heading");
    expect(result.current.panel.focusHeadingId).toBe("subscription-section-heading");
    expect(result.current.panel.modalHeadingId).toBe("settings-modal-fallback-heading");
    expect(result.current.panel.modalHeadingText).toBe("Subscription");
  },
);

/**
 * 测试目标：当传入历史分区 ID 时，应回退至首个可用分区以维持导航可用性。
 * 前置条件：initialSectionId 指向已下线的 privacy 分区。
 * 步骤：
 *  1) 渲染 usePreferenceSections 并读取激活分区。
 * 断言：
 *  - activeSectionId 回退为 subscription。
 *  - panel.headingId 对应 subscription 分区。
 * 边界/异常：
 *  - 若 subscription 被禁用，应回退到下一个可用分区（由 sanitizeActiveSectionId 负责）。
 */
test(
  "Given legacy section id When initializing Then selection falls back to subscription",
  () => {
    const { result } = renderHook(() =>
      usePreferenceSections({ initialSectionId: "privacy", onOpenAccountManager: jest.fn() }),
    );

    expect(result.current.activeSectionId).toBe("subscription");
    expect(result.current.panel.headingId).toBe("subscription-section-heading");
  },
);

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
  mockUseLanguage.mockReturnValue({
    t: createTranslations({
      settingsTabKeyboard: "   ",
      settingsKeyboardDescription: "   ",
    }),
    lang: "en",
  });

  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: "keyboard", onOpenAccountManager: jest.fn() }),
  );

  expect(result.current.panel.focusHeadingId).toBe("keyboard-section-heading");
  expect(result.current.panel.modalHeadingText).toBe(result.current.copy.title);
  expect(result.current.panel.modalHeadingId).toBe("settings-modal-fallback-heading");
});

/**
 * 测试目标：切换分区后备用标题随激活分区更新。
 * 前置条件：默认激活 subscription 分区。
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
    usePreferenceSections({ initialSectionId: undefined, onOpenAccountManager: jest.fn() }),
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
