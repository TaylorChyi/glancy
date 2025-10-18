/**
 * 背景：
 *  - 偏好设置页面需要同时协调文案、响应风格、订阅兑换等领域能力，若集中在主 Hook 会快速膨胀。
 * 目的：
 *  - 以 Facade 组合方式聚合领域服务，向上层暴露统一接口，提升可读性与可测试性。
 * 关键决策与取舍：
 *  - 在内部使用 usePreferenceApiClients、useRedeemSubscription 等子 Hook，实现依赖注入；
 *  - 使用 useMemo 缓存响应风格文案，避免重复生成。
 * 影响范围：
 *  - 偏好设置页面及复用该 Facade 的设置模态。
 * 演进与TODO：
 *  - 可在此加入特性开关，按用户分层启用新分区。
 */
import { useMemo } from "react";
import { usePreferenceCopy } from "./usePreferenceCopy.js";
import { useRedeemSubscription } from "./useRedeemSubscription.js";
import { useResponseStylePreferences } from "./useResponseStylePreferences.js";
import { createResponseStyleCopy } from "./createResponseStyleCopy.js";
import { useSubscriptionBlueprint } from "./useSubscriptionBlueprint.js";
import { usePreferenceApiClients } from "./usePreferenceApiClients.js";

export const usePreferenceDomainServices = ({ translations, user, setUser }) => {
  const {
    emailBinding,
    updateUsernameRequest,
    fetchProfile,
    saveProfile,
    redeemCodeRequest,
  } = usePreferenceApiClients({ user, setUser });

  const preferenceCopy = usePreferenceCopy({ translations, user });
  const { redeemToast, handleRedeem } = useRedeemSubscription({
    translations,
    user,
    setUser,
    redeemCodeRequest,
  });
  const responseStyleCopy = useMemo(() => createResponseStyleCopy(translations), [
    translations,
  ]);
  const responseStylePreferences = useResponseStylePreferences({
    user,
    fetchProfile,
    saveProfile,
  });
  const subscriptionSection = useSubscriptionBlueprint({
    translations,
    user,
    handleRedeem,
  });

  return {
    preferenceCopy,
    responseStyleCopy,
    responseStylePreferences,
    subscriptionSection,
    redeemToast,
    emailBinding,
    updateUsernameRequest,
  };
};
