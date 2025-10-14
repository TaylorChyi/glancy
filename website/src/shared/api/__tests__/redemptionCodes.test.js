import { createRedemptionCodesApi } from "@shared/api/redemptionCodes.js";
import { API_PATHS } from "@core/config/api.js";
import { jest } from "@jest/globals";

/**
 * 测试目标：
 *  - redeem 方法应向后端兑换接口发送 POST 请求并携带兑换码与令牌。
 * 前置条件：
 *  - 提供可观察调用参数的 request 桩函数。
 * 步骤：
 *  1) 基于桩函数初始化 createRedemptionCodesApi；
 *  2) 调用 redeem 传入 token 与 code；
 *  3) 捕获桩函数的调用参数。
 * 断言：
 *  - URL 指向 /api/redemption-codes/redeem；
 *  - 请求方法为 POST；
 *  - headers 含 Content-Type: application/json；
 *  - 请求体 JSON 序列化后的 code 与入参一致。
 */
test("Given code and token When redeem invoked Then posts payload to redemption endpoint", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createRedemptionCodesApi(request);

  await api.redeem({ token: "token-1", code: "VIP-PLUS" });

  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(url).toBe(`${API_PATHS.redemptionCodes}/redeem`);
  expect(options).toMatchObject({ method: "POST", token: "token-1" });
  expect(options.headers["Content-Type"]).toBe("application/json");
  expect(options.body).toBe(JSON.stringify({ code: "VIP-PLUS" }));
});
