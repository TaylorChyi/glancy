/**
 * 背景：
 *  - 订阅蓝图需要从杂乱的用户对象中推导当前套餐，原实现夹杂在主文件中影响可读性。
 * 目的：
 *  - 提供独立的套餐识别器，集中封装候选字段与兼容逻辑。
 * 关键决策与取舍：
 *  - 继续沿用 Set 进行已知套餐校验，保障 O(1) 查询；
 *  - 对历史布尔字段（member）保持兼容，防止回归；
 *  - 暂未引入更复杂的策略模式，后续若套餐矩阵扩展可在此处接入。
 * 影响范围：
 *  - 所有需要解析当前套餐 ID 的构造流程。
 * 演进与TODO：
 *  - TODO: 当服务端统一返回 planId 后，可下调候选字段枚举并删除兜底逻辑。
 */

import { PLAN_SEQUENCE } from "@core/config/pricing";

const KNOWN_PLAN_IDS = new Set(PLAN_SEQUENCE);

/**
 * 意图：
 *  - 根据用户上下文提炼订阅套餐标识，兼容历史字段与未来扩展。
 * 输入：
 *  - userProfile: 可能来自登录或偏好接口的用户对象；
 *  - defaults: 覆盖默认套餐的配置（目前仅暴露 fallbackPlan）。
 * 输出：
 *  - 归一化后的套餐 ID（FREE/PLUS/PRO/PREMIUM）。
 * 流程：
 *  1) 收集 subscription.planId 等候选字段并标准化为大写；
 *  2) 若存在会员布尔标记，将默认 PLUS 作为兜底候选；
 *  3) 返回首个命中已知套餐序列的值，否则回退到 fallbackPlan。
 * 错误处理：
 *  - 对于非字符串或未知取值，自动忽略并继续尝试下一候选。
 */
export const resolveCurrentPlanId = (
  userProfile,
  { fallbackPlan = "FREE" } = {},
) => {
  const subscriptionMeta = userProfile?.subscription ?? {};
  const candidates = [
    subscriptionMeta.planId,
    subscriptionMeta.currentPlanId,
    subscriptionMeta.plan,
    subscriptionMeta.tier,
    userProfile?.plan,
  ]
    .map((candidate) => {
      if (typeof candidate !== "string") {
        return null;
      }
      const trimmed = candidate.trim();
      if (!trimmed) {
        return null;
      }
      return trimmed.toUpperCase();
    })
    .filter(Boolean);

  if (userProfile?.member === true) {
    candidates.push("PLUS");
  }

  for (const candidate of candidates) {
    if (KNOWN_PLAN_IDS.has(candidate)) {
      return candidate;
    }
  }

  return fallbackPlan;
};
