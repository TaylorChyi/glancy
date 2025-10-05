import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

const mockNavigate = jest.fn();

jest.unstable_mockModule("react-router-dom", async () => ({
  ...(await jest.requireActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

let SubscriptionSection;

beforeAll(async () => {
  ({ default: SubscriptionSection } = await import("../SubscriptionSection.jsx"));
});

beforeEach(() => {
  mockNavigate.mockClear();
});

const baseProps = {
  title: "Subscription",
  headingId: "subscription-heading",
  descriptionId: undefined,
  currentPlanCard: {
    title: "Current plan",
    planLine: "Plus · Monthly",
    nextRenewalLabel: "Next: 2025-01-01",
    regionLine: "Region: CN · CNY",
    premiumHighlight: null,
    actions: [
      { id: "manage", label: "Manage" },
      { id: "redeem", label: "Redeem" },
    ],
  },
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
  subscribeCopy: {
    template: "Subscribe {plan}",
    disabledLabel: "Current",
  },
  defaultSelectedPlanId: "PLUS",
  onRedeem: jest.fn(),
  featureColumnLabel: "Feature",
};

/**
 * 测试目标：初始状态下订阅按钮禁用，切换套餐后启用并触发回调。
 * 前置条件：默认选中套餐为 PLUS，提供 onSubscribe 模拟函数。
 * 步骤：
 *  1) 渲染 SubscriptionSection。
 *  2) 点击 PRO 套餐按钮。
 *  3) 点击订阅按钮。
 * 断言：
 *  - 初始订阅按钮禁用。
 *  - 切换后按钮启用并显示新文案。
 *  - onSubscribe 收到 PRO。
 * 边界/异常：
 *  - 若按钮仍禁用则说明选中状态未更新。
 */
test("Given current plan When selecting another plan Then subscribe button enables", () => {
  const onSubscribe = jest.fn();
  render(<SubscriptionSection {...baseProps} onSubscribe={onSubscribe} />);

  const subscribeButton = screen.getByRole("button", { name: "Current" });
  expect(subscribeButton).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Choose Pro" }));

  const updatedButton = screen.getByRole("button", { name: "Subscribe Pro" });
  expect(updatedButton).toBeEnabled();

  fireEvent.click(updatedButton);
  expect(onSubscribe).toHaveBeenCalledWith("PRO");
  expect(mockNavigate).not.toHaveBeenCalled();
});

/**
 * 测试目标：未提供 onSubscribe 时，订阅按钮触发默认导航逻辑。
 * 前置条件：使用默认 props，未传入 onSubscribe。
 * 步骤：
 *  1) 渲染组件并选择 PRO 套餐。
 *  2) 点击订阅按钮。
 * 断言：
 *  - useNavigate 被调用，路径为 /subscription，state 含 plan。
 * 边界/异常：
 *  - 若未调用 navigate，则默认行为失效。
 */
test("Given no onSubscribe When subscribing Then navigates to subscription route", () => {
  mockNavigate.mockClear();
  render(<SubscriptionSection {...baseProps} />);

  fireEvent.click(screen.getByRole("button", { name: "Choose Pro" }));
  const updatedButton = screen.getByRole("button", { name: "Subscribe Pro" });
  fireEvent.click(updatedButton);

  expect(mockNavigate).toHaveBeenCalledWith("/subscription", {
    state: { plan: "PRO" },
  });
});
