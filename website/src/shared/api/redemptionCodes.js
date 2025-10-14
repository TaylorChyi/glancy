import { API_PATHS } from "@core/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";

/**
 * 背景：
 *  - 偏好设置页需要触发兑换流程并刷新用户会员信息，现有 API 模块尚未覆盖兑换码端点。
 * 目的：
 *  - 提供兑换码相关的最小接口集合，复用统一的 API 客户端能力。
 * 关键决策与取舍：
 *  - 采用工厂函数 createRedemptionCodesApi 便于在测试中注入桩实现；
 *  - 暂仅暴露 redeem 方法，待支持查询与批量导入后可扩展。
 * 影响范围：
 *  - 偏好设置、后续的兑换入口均通过该模块访问后端兑换接口。
 * 演进与TODO：
 *  - 未来可补充兑换记录查询、兑换码预检等能力。
 */
export function createRedemptionCodesApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  const redeem = ({ token, code }) =>
    jsonRequest(`${API_PATHS.redemptionCodes}/redeem`, {
      method: "POST",
      token,
      body: { code },
    });

  return { redeem };
}

export const { redeem } = createRedemptionCodesApi();

export function useRedemptionCodesApi() {
  return useApi().redemptionCodes;
}
