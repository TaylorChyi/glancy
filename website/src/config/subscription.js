/**
 * 背景：
 *  - 订阅能力需支持按地区差异化定价，并在前端读取统一结构以便渲染套餐矩阵。
 * 目的：
 *  - 提供基于地区的定价蓝图与解析函数，供 UI 层和后续后端 API 适配。
 * 关键决策与取舍：
 *  - 采用简单配置对象模拟服务端返回，保留 currencySymbol/currency 字段以兼容国际化格式化；
 *  - 通过 resolveRegionPricing 暴露检索接口，后续可接入 IP/CIDR 逻辑或远程请求。
 * 影响范围：
 *  - 偏好设置页订阅分区、订阅模态与任何引用订阅定价的模块。
 * 演进与TODO：
 *  - TODO: 接入真实定价 API 或服务端配置，并支持 exact/CIDR 覆盖策略；
 *  - TODO: 将 refundWindowDays、税费等变量下放为远程配置以便灰度。
 */

const DEFAULT_PRICING = Object.freeze({
  regionCode: "US",
  regionLabel: "United States",
  currency: "USD",
  currencySymbol: "\u0024",
  taxIncluded: false,
  refundWindowDays: 7,
  plans: {
    FREE: { price: 0 },
    PLUS: { monthly: 2.49, yearly: 24.99 },
    PRO: { monthly: 4.99, yearly: 49.99 },
    PREMIUM: { purchase: "redeem_only" },
  },
});

const REGION_PRICING = Object.freeze({
  CN: {
    regionCode: "CN",
    regionLabel: "中国大陆",
    currency: "CNY",
    currencySymbol: "\u00a5",
    taxIncluded: true,
    refundWindowDays: 7,
    plans: {
      FREE: { price: 0 },
      PLUS: { monthly: 18, yearly: 168 },
      PRO: { monthly: 38, yearly: 368 },
      PREMIUM: { purchase: "redeem_only" },
    },
  },
  US: {
    regionCode: "US",
    regionLabel: "United States",
    currency: "USD",
    currencySymbol: "\u0024",
    taxIncluded: false,
    refundWindowDays: 7,
    plans: {
      FREE: { price: 0 },
      PLUS: { monthly: 2.49, yearly: 24.99 },
      PRO: { monthly: 4.99, yearly: 49.99 },
      PREMIUM: { purchase: "redeem_only" },
    },
  },
  EU: {
    regionCode: "EU",
    regionLabel: "European Union",
    currency: "EUR",
    currencySymbol: "\u20ac",
    taxIncluded: true,
    refundWindowDays: 14,
    plans: {
      FREE: { price: 0 },
      PLUS: { monthly: 2.49, yearly: 24.99 },
      PRO: { monthly: 4.99, yearly: 49.99 },
      PREMIUM: { purchase: "redeem_only" },
    },
  },
  JP: {
    regionCode: "JP",
    regionLabel: "日本",
    currency: "JPY",
    currencySymbol: "\u00a5",
    taxIncluded: true,
    refundWindowDays: 8,
    plans: {
      FREE: { price: 0 },
      PLUS: { monthly: 300, yearly: 3000 },
      PRO: { monthly: 600, yearly: 6000 },
      PREMIUM: { purchase: "redeem_only" },
    },
  },
});

/**
 * 意图：
 *  - 根据用户提供的地区代码解析对应的定价配置。
 * 输入：
 *  - regionCode?: string，用户的地区代码（ISO 3166-1 alpha-2）。
 * 输出：
 *  - 订阅定价对象，始终返回非空值。
 * 流程：
 *  1) 若 regionCode 匹配预设地区，直接返回深拷贝；
 *  2) 否则退回 DEFAULT_PRICING。
 * 错误处理：
 *  - 无需特殊错误处理，缺省走默认定价。
 * 复杂度：
 *  - O(1)。
 */
export function resolveRegionPricing({ regionCode } = {}) {
  const candidate = regionCode ? REGION_PRICING[regionCode] : undefined;
  const resolved = candidate || DEFAULT_PRICING;
  return {
    ...resolved,
    plans: {
      FREE: { ...resolved.plans.FREE },
      PLUS: { ...resolved.plans.PLUS },
      PRO: { ...resolved.plans.PRO },
      PREMIUM: { ...resolved.plans.PREMIUM },
    },
  };
}

export const SUBSCRIPTION_PLAN_ORDER = Object.freeze([
  "FREE",
  "PLUS",
  "PRO",
  "PREMIUM",
]);

export default REGION_PRICING;
