import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

let SubscriptionSection;

beforeAll(async () => {
  ({ default: SubscriptionSection } = await import("../SubscriptionSection.jsx"));
});

const baseProps = {
  title: "Subscription",
  headingId: "subscription-heading",
  descriptionId: undefined,
  planCards: [
    {
      id: "FREE",
      title: "Free",
      summary: "Free tier",
      priceLines: ["Free"],
      state: "available",
      badge: "Selected",
      ctaLabel: "Choose Free",
      disabled: false,
    },
    {
      id: "PLUS",
      title: "Plus",
      summary: "Plus tier",
      priceLines: ["$10/month"],
      state: "current",
      badge: "Current",
      ctaLabel: "Current plan",
      disabled: true,
    },
    {
      id: "PRO",
      title: "Pro",
      summary: "Pro tier",
      priceLines: ["$20/month"],
      state: "available",
      badge: "Selected",
      ctaLabel: "Choose Pro",
      disabled: false,
    },
  ],
  featureMatrix: [
    {
      id: "lookup",
      label: "Lookups",
      values: {
        FREE: "50",
        PLUS: "500",
        PRO: "5000",
      },
    },
  ],
  visiblePlanIds: ["FREE", "PLUS", "PRO"],
  planLabels: {
    FREE: "Free",
    PLUS: "Plus",
    PRO: "Pro",
  },
  pricingNote: "Fixed",
  taxNote: "Tax included",
  redeemCopy: {
    title: "Redeem",
    placeholder: "Code",
    buttonLabel: "Redeem now",
  },
  defaultSelectedPlanId: "PLUS",
  onRedeem: jest.fn(),
  featureColumnLabel: "Feature",
};

/**
 * 测试目标：确认订阅 CTA 已移除，仅保留兑换按钮。
 * 前置条件：使用默认属性渲染 SubscriptionSection。
 * 步骤：
 *  1) 渲染组件。
 *  2) 断言兑换按钮存在且不存在包含 Subscribe 文案的按钮。
 * 断言：
 *  - Redeem now 按钮存在。
 *  - 不再渲染订阅相关按钮。
 * 边界/异常：
 *  - 若仍找到 Subscribe 按钮，则说明 CTA 未被移除。
 */
test("Given subscription section When rendered Then subscribe CTA is absent", () => {
  render(<SubscriptionSection {...baseProps} />);

  expect(screen.getByRole("button", { name: "Redeem now" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /subscribe/i })).toBeNull();
});

/**
 * 测试目标：选择不同套餐时，按钮 aria-pressed 状态会更新，便于样式与辅助功能联动。
 * 前置条件：默认选中 PLUS 套餐。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击 PRO 套餐按钮。
 * 断言：
 *  - PRO 按钮的 aria-pressed 为 true。
 *  - FREE 按钮的 aria-pressed 为 false（保持未选中状态）。
 * 边界/异常：
 *  - 若 aria-pressed 未更新，则表示选中态逻辑失效。
 */
test("Given another plan When selecting it Then aria pressed reflects selection", () => {
  render(<SubscriptionSection {...baseProps} />);

  const proButton = screen.getByRole("button", { name: "Choose Pro" });
  const freeButton = screen.getByRole("button", { name: "Choose Free" });

  fireEvent.click(proButton);

  expect(proButton).toHaveAttribute("aria-pressed", "true");
  expect(freeButton).toHaveAttribute("aria-pressed", "false");
});
