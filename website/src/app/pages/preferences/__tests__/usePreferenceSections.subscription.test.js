/**
 * 背景：
 *  - 订阅相关用例原本与蓝图、账户测试混杂在单文件中，难以定位场景。
 * 目的：
 *  - 拆分并专注校验兑换流程与套餐映射逻辑，提升可维护性。
 * 关键决策与取舍：
 *  - 依托共享装配器统一 mock 配置，保障跨文件一致的初始状态；
 *  - 以兑换/会员场景分组，避免重复等待与断言代码。
 * 影响范围：
 *  - 订阅分区相关测试的组织结构。
 * 演进与TODO：
 *  - 后续增加套餐升级/降级交互时，可在此扩展覆盖。
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  createPreferenceSectionsTestContext,
  loadPreferenceSectionsModules,
} from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let activeContext;

const setupContext = (options) => {
  if (activeContext) {
    activeContext.restore();
  }
  activeContext = createPreferenceSectionsTestContext(options);
  return activeContext;
};

beforeAll(async () => {
  ({ usePreferenceSections } = await loadPreferenceSectionsModules());
});

afterEach(() => {
  if (activeContext) {
    activeContext.restore();
    activeContext = undefined;
  }
});

/**
 * 测试目标：
 *  - 兑换成功后应调用兑换接口并刷新用户的会员信息。
 * 前置条件：
 *  - 兑换 API 返回会员奖励。
 * 步骤：
 *  1) 渲染 usePreferenceSections；
 *  2) 调用订阅分区的 onRedeem；
 *  3) 捕获接口与 setUser 调用。
 * 断言：
 *  - redeem API 被传入去除空格后的兑换码与 token；
 *  - setUser 收到更新后的会员/订阅字段。
 * 边界/异常：
 *  - 若 onRedeem 不返回 Promise 或未更新用户则测试失败。
 */
test("Given valid code When redeem resolves Then membership snapshot merges into user", async () => {
  const context = setupContext();
  const reward = {
    membershipType: "PRO",
    expiresAt: "2025-12-31T00:00:00Z",
  };
  context.redeemMock.mockResolvedValueOnce({
    effectType: "MEMBERSHIP",
    membership: reward,
  });

  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  await waitFor(() => {
    expect(
      result.current.sections.find((section) => section.id === "subscription"),
    ).toBeDefined();
  });

  const subscriptionSection = result.current.sections.find(
    (section) => section.id === "subscription",
  );

  await act(async () => {
    await subscriptionSection.componentProps.onRedeem("  vip-pro-2025  ");
  });

  expect(context.redeemMock).toHaveBeenCalledWith({
    token: "token-123",
    code: "vip-pro-2025",
  });
  expect(context.setUserMock).toHaveBeenCalledWith(
    expect.objectContaining({
      member: true,
      isPro: true,
      plan: "PRO",
      membershipType: "PRO",
      membershipExpiresAt: reward.expiresAt,
      subscription: expect.objectContaining({
        planId: "PRO",
        currentPlanId: "PRO",
        tier: "PRO",
        nextRenewalDate: reward.expiresAt,
      }),
    }),
  );
  expect(result.current.feedback.redeemToast).toMatchObject({
    open: true,
    message: context.translations.subscriptionRedeemSuccessToast,
    closeLabel: context.translations.toastDismissLabel,
  });
});

/**
 * 测试目标：
 *  - 当兑换接口抛出异常时 onRedeem 应透传错误并避免更新用户状态。
 * 前置条件：
 *  - redeem API 抛出错误。
 * 步骤：
 *  1) 渲染 usePreferenceSections；
 *  2) 调用 onRedeem；
 *  3) 捕获抛出的异常。
 * 断言：
 *  - Promise 拒绝并包含原始错误；
 *  - 控制台记录错误日志；
 *  - setUser 未被调用。
 * 边界/异常：
 *  - 若错误被吞掉或 setUser 被调用则测试失败。
 */
test("Given redeem failure When onRedeem invoked Then error bubbles without user mutation", async () => {
  const context = setupContext();
  const failure = new Error("invalid-code");
  context.redeemMock.mockRejectedValueOnce(failure);

  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  await waitFor(() => {
    expect(
      result.current.sections.find((section) => section.id === "subscription"),
    ).toBeDefined();
  });

  const subscriptionSection = result.current.sections.find(
    (section) => section.id === "subscription",
  );

  await act(async () => {
    await expect(
      subscriptionSection.componentProps.onRedeem("bad-code"),
    ).rejects.toThrow("invalid-code");
  });

  expect(context.consoleErrorStub).toHaveBeenCalledWith(
    "Failed to redeem subscription code",
    failure,
  );
  expect(context.setUserMock).not.toHaveBeenCalled();
  await waitFor(() => {
    expect(result.current.feedback.redeemToast).toMatchObject({
      open: true,
      message: `${context.translations.subscriptionRedeemFailureToast} (invalid-code)`,
      closeLabel: context.translations.toastDismissLabel,
    });
  });
});

/**
 * 测试目标：当用户仅暴露 member 标记时，订阅蓝图应回退到 PLUS 套餐。
 * 前置条件：用户缺少 plan 字段但 member 为 true。
 * 步骤：
 *  1) 重建测试上下文仅返回 member；
 *  2) 渲染 Hook 并获取订阅分区；
 * 断言：
 *  - 当前套餐牌面为 PLUS；
 *  - planCards 中 PLUS 状态为 current。
 * 边界/异常：
 *  - 若未来提供更细颗粒度的 tier 字段，应优先使用新字段。
 */
test("Given member flag only When mapping subscription plan Then membership fallback resolves to paid plan", () => {
  setupContext({
    user: {
      plan: undefined,
      isPro: undefined,
      token: undefined,
      member: true,
    },
  });

  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  const subscriptionSection = result.current.sections.find(
    (section) => section.id === "subscription",
  );

  expect(subscriptionSection).toBeDefined();
  expect(subscriptionSection.componentProps.defaultSelectedPlanId).toBe("PLUS");
  const plusCard = subscriptionSection.componentProps.planCards.find(
    (card) => card.id === "PLUS",
  );
  expect(plusCard).toBeDefined();
  expect(plusCard.state).toBe("current");
});
