import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import SubscriptionSection from "../SubscriptionSection.jsx";

const renderSection = (overrideProps = {}) => {
  const defaultProps = {
    title: "Subscription",
    headingId: "subscription-heading",
    descriptionId: "subscription-description",
    description: "Pick the plan that fits.",
    plans: [
      {
        id: "free",
        title: "Free",
        shortTitle: "Free",
        description: "Basic experience.",
        pricePrimary: "Free",
        priceSecondary: "",
      },
      {
        id: "plus",
        title: "Plus",
        shortTitle: "Plus",
        description: "More capacity.",
        pricePrimary: "$2.49/mo",
        priceSecondary: "$24.99/yr ($2.08/mo)",
      },
    ],
    featureMatrix: [
      {
        id: "word-lookups-daily",
        label: "Daily lookups",
        values: { free: "50", plus: "500" },
        unitSuffixes: { free: "per day", plus: "per day" },
      },
    ],
    copy: {
      currentPlanTitle: "Current subscription",
      planLine: "Free · Monthly",
      billingLine: "Next renewal: —",
      regionLine: "Region: United States · Currency: USD",
      statusLine: "",
      badges: { current: "Current", selected: "Selected" },
      actions: [
        { id: "manage", label: "Manage", onClick: () => {} },
        { id: "change-plan", label: "Change", onClick: () => {} },
      ],
      matrixCaption: "Compare plan benefits",
      featureHeading: "Capability",
      translate: (key) => key,
      redeem: {
        title: "Redeem",
        description: "Unlock Premium",
        placeholder: "Enter code",
        button: "Redeem",
      },
      subscribe: {
        title: "Subscribe",
        description: "Continue",
        button: "Continue",
        disabledHint: "Already active",
      },
      faqTitle: "FAQ",
      faqItems: [
        { id: "pricing", text: "Pricing is fixed." },
      ],
    },
    currentPlanId: "free",
    onRedeem: jest.fn(),
    onSubscribe: jest.fn(),
  };

  return render(<SubscriptionSection {...defaultProps} {...overrideProps} />);
};

/**
 * 测试目标：当选择的套餐与当前套餐一致时订阅按钮禁用并展示提示。
 * 前置条件：当前套餐为 free，初始选中态与当前一致。
 * 步骤：
 *  1) 渲染订阅分区。
 *  2) 查询订阅按钮与禁用提示。
 * 断言：
 *  - 订阅按钮被禁用。
 *  - 提示文案可见。
 * 边界/异常：
 *  - 若按钮状态错误会导致重复发起订阅流程。
 */
test("Given current plan selected When rendering Then subscribe action disabled", () => {
  renderSection();

  const subscribeButton = screen.getByRole("button", { name: "Continue" });
  expect(subscribeButton).toBeDisabled();
  expect(screen.getByText("Already active")).toBeInTheDocument();
});

/**
 * 测试目标：选择不同套餐后触发订阅回调。
 * 前置条件：当前套餐为 free，存在 plus 套餐可选。
 * 步骤：
 *  1) 渲染订阅分区。
 *  2) 点击 plus 套餐卡片并点击订阅按钮。
 * 断言：
 *  - onSubscribe 被调用且参数为 plus。
 * 边界/异常：
 *  - 若按钮仍禁用则视为回调未触发。
 */
test("Given alternate plan When subscribing Then callback receives plan id", () => {
  const onSubscribe = jest.fn();
  renderSection({ onSubscribe });

  fireEvent.click(screen.getByRole("button", { name: /^Plus/ }));
  const subscribeButton = screen.getByRole("button", { name: "Continue" });
  fireEvent.click(subscribeButton);

  expect(onSubscribe).toHaveBeenCalledWith("plus");
});

/**
 * 测试目标：兑换码提交时应转为大写并调用回调。
 * 前置条件：默认表单启用，回调为 jest mock。
 * 步骤：
 *  1) 输入兑换码并点击兑换按钮。
 * 断言：
 *  - onRedeem 接收到大写后的兑换码。
 * 边界/异常：
 *  - 若输入为空应保持禁用状态，不触发回调。
 */
test("Given redeem code When submitting Then callback receives uppercase code", () => {
  const onRedeem = jest.fn();
  renderSection({ onRedeem });

  const input = screen.getByPlaceholderText("Enter code");
  fireEvent.change(input, { target: { value: "abcd-1234" } });
  fireEvent.click(screen.getByRole("button", { name: "Redeem" }));

  expect(onRedeem).toHaveBeenCalledWith("ABCD-1234");
});
