/**
 * 背景：
 *  - 订阅分区的呈现依赖用户身份与兑换回调，原先散布在主 Hook 中导致职责混乱。
 * 目的：
 *  - 封装订阅区的蓝图构建逻辑，便于在页面或模态中复用，且保持对 buildSubscriptionSectionProps 的包装。
 * 关键决策与取舍：
 *  - 使用 useMemo 保持输出引用稳定，避免不必要的重渲染。
 * 影响范围：
 *  - 偏好设置的订阅分区及未来可能独立复用的订阅管理界面。
 * 演进与TODO：
 *  - 可在此接入分级授权，针对不同会员等级定制展示。
 */
import { useMemo } from "react";
import { buildSubscriptionSectionProps } from "../sections/subscriptionBlueprint.js";

export const useSubscriptionBlueprint = ({ translations, user, handleRedeem }) =>
  useMemo(
    () =>
      buildSubscriptionSectionProps({
        translations,
        user,
        onRedeem: handleRedeem,
      }),
    [handleRedeem, translations, user],
  );
