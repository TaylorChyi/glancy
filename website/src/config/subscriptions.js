/**
 * 背景：
 *  - 订阅定价、权限矩阵原先散落在设计文档中，前端无统一配置来源，导致页面实现倾向硬编码且难以响应后续调价。
 * 目的：
 *  - 将套餐蓝图、特性矩阵与地区定价抽象为纯数据配置，供前端 Hook 及后端 API 共同复用，避免组件层写死业务参数。
 * 关键决策与取舍：
 *  - 采用“计划蓝图 + 特性矩阵 + 地区定价”三段式结构，既覆盖渲染所需文案，也为未来接入服务端动态配置留下接口；
 *  - 拒绝在组件中存放默认值，所有套餐与价格均由本配置导出，后续若迁移到 API，可通过版本号与键名保持兼容。
 * 影响范围：
 *  - 偏好设置中的订阅分区、后续的订阅详情页、以及潜在的升级弹窗均应基于该配置读取数据。
 * 演进与TODO：
 *  - TODO: 接入实时地区识别后，可由后端下发覆盖文件并以 VERSION 字段驱动缓存刷新；
 *  - TODO: 针对企业版或教育版可扩展额外的 plan blueprint，而不影响现有枚举。
 */

export const SUBSCRIPTION_PLAN_BLUEPRINT = Object.freeze([
  {
    id: "free",
    tier: "FREE",
    labelKey: "plan.free.title",
    descriptionKey: "plan.free.desc",
    actionKey: "plan.free.action",
    purchaseType: "free",
    order: 0,
  },
  {
    id: "plus",
    tier: "PLUS",
    labelKey: "plan.plus.title",
    descriptionKey: "plan.plus.desc",
    actionKey: "plan.plus.action",
    purchaseType: "paid",
    order: 1,
  },
  {
    id: "pro",
    tier: "PRO",
    labelKey: "plan.pro.title",
    descriptionKey: "plan.pro.desc",
    actionKey: "plan.pro.action",
    purchaseType: "paid",
    order: 2,
  },
  {
    id: "premium",
    tier: "PREMIUM",
    labelKey: "plan.premium.title",
    descriptionKey: "plan.premium.desc",
    actionKey: "plan.premium.action",
    purchaseType: "redeem_only",
    order: 3,
    hiddenByDefault: true,
  },
]);

export const SUBSCRIPTION_FEATURE_MATRIX = Object.freeze([
  {
    id: "word-lookups-daily",
    labelKey: "subscription.feature.wordLookupsDaily",
    unitKey: "subscription.unit.timesPerDay",
    values: {
      free: "50",
      plus: "500",
      pro: "5,000",
      premium: "20,000",
    },
  },
  {
    id: "llm-calls-daily",
    labelKey: "subscription.feature.llmCallsDaily",
    unitKey: "subscription.unit.timesPerDay",
    values: {
      free: "10",
      plus: "200",
      pro: "2,000",
      premium: "20,000",
    },
  },
  {
    id: "tts-daily",
    labelKey: "subscription.feature.ttsDaily",
    unitKey: "subscription.unit.timesPerDay",
    values: {
      free: "50",
      plus: "1,000",
      pro: "10,000",
      premium: "100,000",
    },
  },
  {
    id: "notebook-capacity",
    labelKey: "subscription.feature.notebookCapacity",
    unitKey: "subscription.unit.entries",
    values: {
      free: "1,000",
      plus: "5,000",
      pro: "50,000",
      premium: "500,000",
    },
  },
  {
    id: "parallel-languages",
    labelKey: "subscription.feature.parallelLanguages",
    unitKey: "subscription.unit.languages",
    values: {
      free: "2",
      plus: "5",
      pro: "10",
      premium: "20",
    },
  },
  {
    id: "ocr-pages",
    labelKey: "subscription.feature.ocrPages",
    unitKey: "subscription.unit.pagesPerMonth",
    values: {
      free: "—",
      plus: "50",
      pro: "500",
      premium: "5,000",
    },
  },
  {
    id: "pdf-pages",
    labelKey: "subscription.feature.pdfPages",
    unitKey: "subscription.unit.pagesPerMonth",
    values: {
      free: "—",
      plus: "50",
      pro: "500",
      premium: "5,000",
    },
  },
  {
    id: "concurrent-requests",
    labelKey: "subscription.feature.concurrentRequests",
    unitKey: "subscription.unit.concurrent",
    values: {
      free: "1",
      plus: "2",
      pro: "5",
      premium: "10",
    },
  },
  {
    id: "queue-priority",
    labelKey: "subscription.feature.queuePriority",
    values: {
      free: "subscription.feature.queuePriority.normal",
      plus: "subscription.feature.queuePriority.medium",
      pro: "subscription.feature.queuePriority.high",
      premium: "subscription.feature.queuePriority.max",
    },
  },
  {
    id: "devices",
    labelKey: "subscription.feature.devices",
    unitKey: "subscription.unit.devices",
    values: {
      free: "2",
      plus: "3",
      pro: "5",
      premium: "10",
    },
  },
  {
    id: "ad-free",
    labelKey: "subscription.feature.adFree",
    values: {
      free: "subscription.feature.switch.no",
      plus: "subscription.feature.switch.yes",
      pro: "subscription.feature.switch.yes",
      premium: "subscription.feature.switch.yes",
    },
  },
  {
    id: "exports",
    labelKey: "subscription.feature.exports",
    values: {
      free: "subscription.feature.exports.free",
      plus: "subscription.feature.exports.plus",
      pro: "subscription.feature.exports.pro",
      premium: "subscription.feature.exports.premium",
    },
  },
  {
    id: "history",
    labelKey: "subscription.feature.history",
    unitKey: "subscription.unit.days",
    values: {
      free: "30",
      plus: "180",
      pro: "365",
      premium: "subscription.feature.history.unlimited",
    },
  },
  {
    id: "beta",
    labelKey: "subscription.feature.beta",
    values: {
      free: "subscription.feature.switch.no",
      plus: "subscription.feature.beta.apply",
      pro: "subscription.feature.beta.default",
      premium: "subscription.feature.beta.priority",
    },
  },
  {
    id: "support",
    labelKey: "subscription.feature.support",
    unitKey: "subscription.unit.hours",
    values: {
      free: "72h",
      plus: "48h",
      pro: "24h",
      premium: "12h",
    },
  },
]);

export const SUBSCRIPTION_REGIONAL_PRICING = Object.freeze({
  VERSION: "2024-10-05",
  default: {
    country: "US",
    regionLabel: "United States",
    currency: "USD",
    currencySymbol: "$",
    taxIncluded: false,
    policies: {
      refundWindowDays: 7,
    },
    plans: {
      free: { price: 0 },
      plus: {
        monthly: 2.49,
        yearly: 24.99,
      },
      pro: {
        monthly: 4.99,
        yearly: 49.99,
      },
      premium: {
        purchase: "redeem_only",
      },
    },
  },
  CN: {
    country: "CN",
    regionLabel: "中国大陆",
    currency: "CNY",
    currencySymbol: "¥",
    taxIncluded: true,
    policies: {
      refundWindowDays: 7,
    },
    plans: {
      free: { price: 0 },
      plus: {
        monthly: 18,
        yearly: 168,
      },
      pro: {
        monthly: 38,
        yearly: 368,
      },
      premium: {
        purchase: "redeem_only",
      },
    },
  },
  EU: {
    country: "EU",
    regionLabel: "European Union",
    currency: "EUR",
    currencySymbol: "€",
    taxIncluded: false,
    policies: {
      refundWindowDays: 7,
    },
    plans: {
      free: { price: 0 },
      plus: {
        monthly: 2.49,
        yearly: 24.99,
      },
      pro: {
        monthly: 4.99,
        yearly: 49.99,
      },
      premium: {
        purchase: "redeem_only",
      },
    },
  },
  JP: {
    country: "JP",
    regionLabel: "日本",
    currency: "JPY",
    currencySymbol: "¥",
    taxIncluded: true,
    policies: {
      refundWindowDays: 7,
    },
    plans: {
      free: { price: 0 },
      plus: {
        monthly: 300,
        yearly: 3000,
      },
      pro: {
        monthly: 600,
        yearly: 6000,
      },
      premium: {
        purchase: "redeem_only",
      },
    },
  },
});

export const SUBSCRIPTION_POLICY_COPY_KEYS = Object.freeze({
  pricingNoteKey: "pricing.fixedNote",
  taxIncludedKey: "pricing.tax.included",
  taxExcludedKey: "pricing.tax.excluded",
  autoRenewKey: "subscription.policy.autoRenew",
  invoiceKey: "subscription.policy.invoice",
  refundKey: "subscription.policy.refund",
  supportKey: "subscription.policy.support",
});
