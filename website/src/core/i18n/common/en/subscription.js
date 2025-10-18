/**
 * 背景：
 *  - 订阅与计费相关文案与其他领域混杂，扩展新套餐时难以及时定位。
 * 目的：
 *  - 聚焦管理套餐、价格、兑换与提示类文案，降低增补/调整时的认知负担。
 * 关键决策与取舍：
 *  - 继续使用原有键名并通过模块导出，避免影响现有渲染逻辑；
 *  - 同步收拢 Toast/按钮等紧耦合订阅流程的文案，保持上下文一致。
 * 影响范围：
 *  - 订阅管理页、套餐对比、兑换流程与定价提示的全部英文文案。
 * 演进与TODO：
 *  - 若未来支持更多地区差异化文案，可在此模块内按地区拆分子对象。
 */
const subscriptionCopy = {
  settingsTabSubscription: "Subscription",
  subscriptionCurrentTitle: "Current plan",
  subscriptionPlanFreeTitle: "Free",
  subscriptionPlanFreeSummary: "Essential lookups with inline ads",
  subscriptionPlanFreeCta: "Get started",
  subscriptionPlanPlusTitle: "Plus",
  subscriptionPlanPlusSummary: "Ad-free · higher limits · cloud sync",
  subscriptionPlanPlusCta: "Upgrade to Plus",
  subscriptionPlanProTitle: "Pro",
  subscriptionPlanProSummary: "OCR/PDF capture · concurrency · pro-grade quotas",
  subscriptionPlanProCta: "Upgrade to Pro",
  subscriptionPlanPremiumTitle: "Premium",
  subscriptionPlanPremiumSummary:
    "All Pro features with elite capacity and priority access",
  subscriptionPlanPremiumCta: "Unlocked",
  subscriptionSoftLimitNote: " (soft limit, fair use)",
  subscriptionValueNone: "None",
  subscriptionValueUnavailable: "Not available",
  subscriptionValueYes: "Yes",
  subscriptionValueNo: "No",
  subscriptionHistoryRetentionTemplate: "{value} days",
  subscriptionHistoryRetentionUnlimited: "Full history",
  subscriptionSupportSloTemplate: "{value}-hour response",
  subscriptionFeatureWordLookupsDaily: "Daily lookup allowance",
  subscriptionUnitTimesPerDay: "{value} / day",
  subscriptionFeatureAiCallsDaily: "AI explanations / rewrites (LLM)",
  subscriptionFeatureTtsDaily: "TTS playback",
  subscriptionFeatureNotebookCapacity: "Vocabulary notebook capacity",
  subscriptionUnitItems: "{value} entries",
  subscriptionFeatureAlignedLanguages: "Aligned example languages",
  subscriptionUnitLanguages: "{value} languages",
  subscriptionFeatureOcrPages: "OCR / image capture",
  subscriptionFeaturePdfPages: "PDF capture",
  subscriptionUnitPagesPerMonth: "{value} pages / month",
  subscriptionFeatureConcurrentRequests: "Concurrent requests",
  subscriptionUnitConcurrent: "{value} lanes",
  subscriptionFeaturePriority: "Queue priority",
  subscriptionPriorityStandard: "Standard",
  subscriptionPriorityHigher: "Higher",
  subscriptionPriorityHigh: "High",
  subscriptionPriorityHighest: "Highest",
  subscriptionFeatureDevices: "Signed-in devices",
  subscriptionUnitDevices: "{value} devices",
  subscriptionFeatureAdFree: "Ad-free experience",
  subscriptionFeatureBulkExport: "Bulk import/export",
  subscriptionBulkExportExportOnly: "Export only",
  subscriptionBulkExportImportExport: "Import & export",
  subscriptionBulkExportImportExportApi: "Import/export + API",
  subscriptionFeatureHistoryRetention: "History retention",
  subscriptionFeatureBetaAccess: "Beta access",
  subscriptionBetaAccessNo: "Not available",
  subscriptionBetaAccessApply: "Apply on demand",
  subscriptionBetaAccessDefault: "Default access",
  subscriptionBetaAccessPriority: "Priority access",
  subscriptionFeatureSupportSlo: "Support response SLA",
  subscriptionPlanCurrentBadge: "Current plan",
  subscriptionPlanSelectedBadge: "Selected",
  subscriptionPlanLockedBadge: "Redeem only",
  subscriptionPlanFreePrice: "Free",
  subscriptionPriceMonthly: "{amount} / month",
  subscriptionPriceYearly: "{amount} / year",
  subscriptionPriceYearlyWithEquivalent: "{amount} (avg. {equivalent} / month)",
  subscriptionBillingCycleMonthly: "Monthly",
  subscriptionBillingCycleYearly: "Yearly",
  subscriptionNextRenewalTemplate: "Next renewal: {value}",
  subscriptionRegionLineTemplate: "Region: {value}",
  subscriptionPremiumHighlight:
    "Unlocked maximum capacity and priority, including all Pro capabilities, beta priority, and a 12-hour support SLA",
  subscriptionActionManage: "Manage",
  subscriptionActionUpgrade: "Upgrade",
  subscriptionActionDowngrade: "Downgrade",
  subscriptionActionChangeRegion: "Change region",
  subscriptionActionRedeem: "Redeem code",
  subscriptionRedeemTitle: "Redeem exclusive benefits",
  subscriptionRedeemPlaceholder: "Enter 16-character code",
  subscriptionRedeemButton: "Redeem now",
  subscriptionRedeemSuccessToast:
    "Redeemed successfully. Your benefits are active.",
  subscriptionRedeemFailureToast:
    "Unable to redeem at the moment. Please try again.",
  subscriptionFeatureColumnLabel: "Feature",
  toastDismissLabel: "Dismiss notification",
  pricingFixedNote: "Pricing is pegged per region and not tied to FX rates.",
  pricingTaxIncluded: "Tax included",
  pricingTaxExcluded: "Tax excluded; local taxes may apply at checkout",
  paymentTitle: "Payment Method",
  alipay: "Alipay",
  wechat: "WeChat",
  choosePlan: "Choose Plan",
  confirm: "Confirm",
};

export default subscriptionCopy;
