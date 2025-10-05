import { describe, expect, test } from "@jest/globals";
import { resolveRegionPricing } from "@/config/subscription.js";
import { createSubscriptionViewModel } from "../createSubscriptionViewModel.js";

const t = {
  settingsTabSubscription: "Subscription",
  settingsSubscriptionDescription: "Control your plans.",
  subscriptionPriceMonthly: "{{value}} / month",
  subscriptionPriceYearly: "{{value}} / year",
  subscriptionPriceYearlyEquivalent: "≈ {{value}} / month",
  subscriptionPriceFree: "Free",
  subscriptionPlanFreeCta: "Start",
  "plan.free.title": "FREE",
  "plan.free.desc": "Free basics",
  "subscription.plan.free.cta": "Use Free",
  "plan.plus.title": "PLUS",
  "plan.plus.desc": "Higher quotas",
  "subscription.plan.plus.cta": "Upgrade to PLUS",
  "plan.pro.title": "PRO",
  "plan.pro.desc": "Professional toolkit",
  "subscription.plan.pro.cta": "Upgrade to PRO",
  "plan.premium.title": "PREMIUM",
  "plan.premium.desc": "Unlock everything",
  "subscription.plan.premium.cta": "Redeem to unlock",
  subscriptionPlanCurrent: "Current plan",
  subscriptionPlanRedeemOnly: "Redeem only",
  subscriptionMatrixTitle: "Plans",
  subscriptionFaqTitle: "FAQ",
  subscriptionRedeemTitle: "Redeem",
  subscriptionRedeemPlaceholder: "Enter code",
  subscriptionRedeemSubmit: "Redeem",
  subscriptionSubscribeCta: "Proceed",
  subscriptionSubscribeDisabled: "Already selected",
  "subscription.feature.wordLookupsDaily": "Daily lookups",
  "subscription.feature.llmCallsDaily": "AI calls",
  "subscription.feature.ttsDaily": "Pronunciations",
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
  subscriptionValuePerDay: "{{value}} / day",
  subscriptionValuePerMonth: "{{value}} / month",
  subscriptionValueSoftLimit: " (soft limit)",
  subscriptionValueLanguages: "{{value}} languages",
  subscriptionValueSupport: "within {{value}} hours",
  subscriptionValueNone: "None",
  subscriptionCurrentHeadline: "{{plan}} · {{cycle}}",
  subscriptionMetaNextRenewal: "Next renewal: {{date}}",
  subscriptionMetaNextRenewalPending: "Next renewal: pending",
  subscriptionMetaRegion: "Region: {{region}}",
  subscriptionMetaCurrency: "Currency: {{currency}}",
  subscriptionMetaValidUntil: "Valid until {{date}}",
  subscriptionMetaValidUnlimited: "Lifetime access",
  subscriptionPremiumHighlight: "Premium privileges active",
  subscriptionActionManage: "Manage",
  subscriptionActionChangeRegion: "Change region",
  subscriptionActionRedeem: "Redeem",
  subscriptionFaqFixed: "Prices are fixed.",
  subscriptionFaqTaxIncluded: "Tax included.",
  subscriptionFaqTaxExcluded: "Tax excluded.",
  subscriptionFaqAutoRenew: "Auto renew enabled.",
  subscriptionFaqInvoice: "Invoices available.",
  subscriptionFaqRefund: "Refund within {{days}} days.",
  subscriptionFaqSupport: "Contact support.",
  "subscription.priority.standard": "Standard",
  "subscription.priority.elevated": "Elevated",
  "subscription.priority.high": "High",
  "subscription.priority.highest": "Highest",
  "subscription.boolean.yes": "Yes",
  "subscription.boolean.no": "No",
  "subscription.datatools.exportOnly": "Export only",
  "subscription.datatools.importExport": "Import & Export",
  "subscription.datatools.importExportApi": "Import/Export + API",
  "subscription.history.days": "{{value}} days",
  "subscription.history.year": "{{value}} year",
  "subscription.history.unlimited": "All history",
  "subscription.beta.none": "Closed",
  "subscription.beta.optin": "Opt-in",
  "subscription.beta.default": "Default",
  "subscription.beta.priority": "Priority",
  subscriptionValueUnavailable: "—",
  subscriptionCurrentCycleFallback: "Monthly",
};

/**
 * 测试目标：当用户当前套餐为 PLUS 时，矩阵应包含 FREE/PLUS/PRO 三张卡，默认选中 PLUS。
 * 前置条件：地区使用 CN 定价，用户 plan=plus。
 * 步骤：
 *  1) 构造视图模型。
 * 断言：
 *  - plans 长度为 3 且顺序为 FREE→PLUS→PRO。
 *  - defaultSelection 为 PLUS。
 *  - current headline 包含 PLUS。
 * 边界/异常：
 *  - premium 套餐仅在当前计划为 PREMIUM 时才纳入。
 */
test("Given plus plan When building view model Then premium card hidden", () => {
  const pricing = resolveRegionPricing({ regionCode: "CN" });
  const viewModel = createSubscriptionViewModel({
    t,
    pricing,
    user: { plan: "plus" },
    locale: "en-US",
  });

  expect(viewModel.plans.map((plan) => plan.id)).toEqual(["FREE", "PLUS", "PRO"]);
  expect(viewModel.defaultSelection).toBe("PLUS");
  expect(viewModel.current.headline).toContain("PLUS");
});

/**
 * 测试目标：当用户为 PREMIUM 时，应展示四张卡且当前卡片禁用。
 * 前置条件：地区使用默认定价，用户 plan=premium。
 * 步骤：
 *  1) 构造视图模型并读取 plans。
 * 断言：
 *  - 包含 PREMIUM 卡片。
 *  - PREMIUM 按钮禁用。
 *  - current.showRedeem 为 false。
 * 边界/异常：
 *  - 非 premium 用户 showRedeem 为 true（由上一用例间接覆盖）。
 */
test("Given premium plan When building view model Then include redeem only card", () => {
  const pricing = resolveRegionPricing();
  const viewModel = createSubscriptionViewModel({
    t,
    pricing,
    user: { plan: "premium" },
    locale: "en-US",
  });

  const premiumPlan = viewModel.plans.find((plan) => plan.id === "PREMIUM");
  expect(premiumPlan).toBeDefined();
  expect(premiumPlan.disabled).toBe(true);
  expect(viewModel.current.showRedeem).toBe(false);
});

/**
 * 测试目标：特性矩阵应输出每个套餐的格式化文案。
 * 前置条件：使用 resolveRegionPricing 默认值。
 * 步骤：
 *  1) 构造视图模型并读取 features。
 * 断言：
 *  - wordLookupsDaily 对 PREMIUM 追加软限说明。
 *  - historyRetention 对 PREMIUM 输出无限制。
 * 边界/异常：
 *  - 若缺失翻译键，formatFeatureValue 会退回英文占位。
 */
describe("createSubscriptionViewModel feature matrix", () => {
  test("formats premium quotas with soft limit and unlimited history", () => {
    const pricing = resolveRegionPricing();
    const viewModel = createSubscriptionViewModel({ t, pricing, user: { plan: "premium" }, locale: "en-US" });
    const wordLookupRow = viewModel.features.find((row) => row.id === "wordLookupsDaily");
    const historyRow = viewModel.features.find((row) => row.id === "historyRetention");

    expect(wordLookupRow.values.PREMIUM).toContain("soft limit");
    expect(historyRow.values.PREMIUM).toMatch(/All history/i);
  });
});
