import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

let SubscriptionSection;

beforeAll(async () => {
  ({ default: SubscriptionSection } = await import(
    "../SubscriptionSection.jsx"
  ));
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
      subscriptionExpiryLine: "Next: 2025-01-01",
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

  expect(
    screen.getByRole("button", { name: "Redeem now" }),
  ).toBeInTheDocument();
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

/**
 * 测试目标：当当前套餐存在到期时间时，选中态卡片应展示该信息，并在切换到其他套餐后隐藏。
 * 前置条件：PLUS 套餐为当前套餐且提供 subscriptionExpiryLine。
 * 步骤：
 *  1) 渲染组件并确认默认选中 PLUS 卡片。
 *  2) 切换选中到 PRO 套餐。
 * 断言：
 *  - 初始渲染时可以看到 Next: 2025-01-01 文案。
 *  - 选中 PRO 后该文案消失，确保仅在选中状态展示。
 * 边界/异常：
 *  - 若文案未出现或无法隐藏，说明展示条件判断失效。
 */
test("Given subscription expiry When toggling selection Then expiry line only visible on active card", () => {
  render(<SubscriptionSection {...baseProps} />);

  expect(screen.getByText("Next: 2025-01-01")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Choose Pro" }));

  expect(screen.queryByText("Next: 2025-01-01")).toBeNull();
});

/**
 * 测试目标：输入兑换码时按四位分组展示，但提交时回传未分隔的原始值。
 * 前置条件：渲染组件并传入可观察的 onRedeem 回调。
 * 步骤：
 *  1) 在输入框中输入包含分隔符的兑换码。
 *  2) 触发兑换按钮。
 * 断言：
 *  - 输入框展示的值被自动插入短横线分组。
 *  - onRedeem 收到的参数不含分隔符，保持纯兑换码。
 * 边界/异常：
 *  - 若展示值与原始值混淆，说明输入/输出解耦失败。
 */
test("Given redeem code input When formatting Then display groups but callback receives raw code", () => {
  const onRedeem = jest.fn();
  render(<SubscriptionSection {...baseProps} onRedeem={onRedeem} />);

  const input = screen.getByPlaceholderText("Code");
  fireEvent.change(input, { target: { value: "abcd1234efgh5678" } });

  expect(input).toHaveValue("abcd-1234-efgh-5678");

  fireEvent.change(input, { target: { value: "abcd-1234-efgh-5678" } });
  fireEvent.click(screen.getByRole("button", { name: "Redeem now" }));

  expect(onRedeem).toHaveBeenCalledWith("abcd1234efgh5678");
});
