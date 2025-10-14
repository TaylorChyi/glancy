import { jest } from "@jest/globals";

let buildSubscriptionSectionProps;

beforeAll(async () => {
  ({ buildSubscriptionSectionProps } = await import(
    "../subscriptionBlueprint.js"
  ));
});

const createTranslations = (overrides = {}) => ({
  subscriptionCurrentTitle: "Current subscription",
  subscriptionPlanFreeTitle: "Free",
  subscriptionPlanFreeSummary: "Free summary",
  subscriptionPlanFreeCta: "Stay free",
  subscriptionPlanPlusTitle: "Plus",
  subscriptionPlanPlusSummary: "Plus summary",
  subscriptionPlanPlusCta: "Upgrade Plus",
  subscriptionPlanProTitle: "Pro",
  subscriptionPlanProSummary: "Pro summary",
  subscriptionPlanProCta: "Upgrade Pro",
  subscriptionPlanPremiumTitle: "Premium",
  subscriptionPlanPremiumSummary: "Premium summary",
  subscriptionPlanPremiumCta: "Premium locked",
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
  subscriptionActionRedeem: "Redeem",
  subscriptionRedeemTitle: "Redeem",
  subscriptionRedeemPlaceholder: "Code",
  subscriptionRedeemButton: "Redeem now",
  subscriptionFeatureColumnLabel: "Feature",
  pricingFixedNote: "Fixed pricing",
  pricingTaxIncluded: "Tax included",
  pricingTaxExcluded: "Tax excluded",
  settingsTabSubscription: "Subscription",
  ...overrides,
});

const createUser = (overrides = {}) => ({
  username: "amy",
  subscription: {
    planId: "FREE",
    billingCycle: "monthly",
    regionLabel: "US · USD",
    nextRenewalDate: "2025-01-01",
    ...overrides,
  },
});

/**
 * 测试目标：包含 {amount}/{equivalent} 占位符的文案在构建套餐卡片时被正确替换。
 * 前置条件：使用默认定价配置与含占位符的翻译文案。
 * 步骤：
 *  1) 调用 buildSubscriptionSectionProps 构建订阅分区 props。
 *  2) 读取 PLUS 套餐的价格行。
 * 断言：
 *  - 月付与年付文案均不再包含花括号。
 *  - 月付文案格式为 "$2.49/m"。
 *  - 年付折算文案格式为 "$24.99/y ($2.08/m)"。
 * 边界/异常：
 *  - 若 pricing 配置缺失数值则回退为占位符（由 fallback 逻辑覆盖）。
 */
test("Given amount placeholders When building plan cards Then price lines interpolate", () => {
  const props = buildSubscriptionSectionProps({
    translations: createTranslations(),
    user: createUser(),
    onRedeem: jest.fn(),
  });

  const plusCard = props.planCards.find((plan) => plan.id === "PLUS");
  expect(plusCard).toBeDefined();
  expect(plusCard.priceLines).toContain("$2.49/m");
  expect(plusCard.priceLines).toContain("$24.99/y ($2.08/m)");
  plusCard.priceLines.forEach((line) => {
    expect(line.includes("{")).toBe(false);
  });
  expect(props.subscribeCopy).toBeUndefined();
});

/**
 * 测试目标：当翻译文案缺失模板时，数值格式化仍能提供兜底展示。
 * 前置条件：移除 subscriptionPriceMonthly/Yearly 模板。
 * 步骤：
 *  1) 传入不含模板的翻译对象构建 props。
 *  2) 读取 PLUS 套餐的价格行。
 * 断言：
 *  - 月付与年付均退化为格式化货币字符串。
 * 边界/异常：
 *  - 若货币符号缺失则使用默认 "—"（由 normalizeDisplayValue 保障）。
 */
test("Given missing templates When building plan cards Then fallback formatting applies", () => {
  const props = buildSubscriptionSectionProps({
    translations: createTranslations({
      subscriptionPriceMonthly: "",
      subscriptionPriceYearly: "",
      subscriptionPriceYearlyWithEquivalent: "",
    }),
    user: createUser(),
    onRedeem: jest.fn(),
  });

  const plusCard = props.planCards.find((plan) => plan.id === "PLUS");
  expect(plusCard).toBeDefined();
  expect(plusCard.priceLines).toContain("$2.49/月");
  expect(plusCard.priceLines).toContain("$24.99/年");
  plusCard.priceLines.forEach((line) => {
    expect(line.includes("{")).toBe(false);
  });
});

/**
 * 测试目标：当前套餐为付费方案且提供续订日期时，卡片应生成到期提示文案。
 * 前置条件：用户订阅信息包含 planId=PLUS 与 nextRenewalDate。
 * 步骤：
 *  1) 构建订阅分区 props；
 *  2) 读取 PLUS 与 FREE 套餐卡片；
 * 断言：
 *  - PLUS 卡片的 subscriptionExpiryLine 含有 Next: 字样；
 *  - FREE 卡片不应包含 subscriptionExpiryLine。
 * 边界/异常：
 *  - 若日期不可解析，应回退到模板 fallback（由 formatRenewalDate 覆盖）。
 */
test("Given paid subscription When building cards Then expiry line attaches to current plan", () => {
  const props = buildSubscriptionSectionProps({
    translations: createTranslations(),
    user: createUser({ planId: "PLUS" }),
    onRedeem: jest.fn(),
  });

  const plusCard = props.planCards.find((plan) => plan.id === "PLUS");
  const freeCard = props.planCards.find((plan) => plan.id === "FREE");

  expect(plusCard).toBeDefined();
  expect(plusCard.subscriptionExpiryLine).toMatch(/Next:/);
  expect(plusCard.subscriptionExpiryLine).toMatch(/2025/);
  expect(freeCard).toBeDefined();
  expect(freeCard.subscriptionExpiryLine).toBeUndefined();
});
