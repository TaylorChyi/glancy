/**
 * 背景：
 *  - 订阅权益与计费词条在单一文件中体量巨大，不利于版本演进。
 * 目的：
 *  - 提供订阅与支付相关的集中词条，支持不同套餐和地区的快速扩展。
 * 关键决策与取舍：
 *  - 保留原有键名，同时通过对象归类保持与业务域一致；
 *  - 未额外抽象层级，避免在消费端增加取值复杂度。
 * 影响范围：
 *  - 订阅中心、支付弹窗及权益说明模块。
 * 演进与TODO：
 *  - 后续若引入企业版，可在此模块按计划/渠道扩展子对象。
 */
const subscription = {
  settingsTabSubscription: "Subscription",
  subscriptionCurrentTitle: "Current plan",
  subscriptionPlanFreeTitle: "Free",
  subscriptionPlanFreeSummary: "Essential lookups with inline ads",
  subscriptionPlanFreeCta: "Get started",
  subscriptionPlanPlusTitle: "Plus",
  subscriptionPlanPlusSummary: "Ad-free · higher limits · cloud sync",
  subscriptionPlanPlusCta: "Upgrade to Plus",
  subscriptionPlanProTitle: "Pro",
  subscriptionPlanProSummary:
    "OCR/PDF capture · concurrency · pro-grade quotas",
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
  subscriptionPriceYearlyWithEquivalent:
    "{amount} (avg. {equivalent} / month)",
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

export default subscription;
