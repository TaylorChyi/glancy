/**
 * 背景：
 *  - 偏好设置页面的分区装配曾集中在 usePreferenceSections 中，造成 Hook 超长且难以扩展。
 * 目的：
 *  - 抽离分区蓝图构建逻辑，提供纯 Hook 以策略模式组合各功能区。
 * 关键决策与取舍：
 *  - 采用 useMemo 缓存 createSections 结果，避免在依赖未变时重复计算；
 *  - 响应风格处理器以对象注入，保持对 createSections 的向后兼容。
 * 影响范围：
 *  - 偏好设置页面与任何复用分区蓝图的模态/嵌入式入口。
 * 演进与TODO：
 *  - 后续可引入按需加载策略，将重量级分区延迟装配。
 */
import { useMemo } from "react";
import { createSections } from "./createSections.js";

export const useSectionsBlueprint = ({
  translations,
  responseStylePreferences,
  responseStyleCopy,
  accountModel,
  subscriptionSection,
}) =>
  useMemo(
    () =>
      createSections({
        translations,
        responseStyleState: responseStylePreferences.state,
        responseStyleCopy,
        responseStyleHandlers: {
          onRetry: responseStylePreferences.handleRetry,
          onFieldChange: responseStylePreferences.handleFieldChange,
          onFieldCommit: responseStylePreferences.handleFieldCommit,
        },
        accountModel,
        subscriptionSection,
      }),
    [
      accountModel,
      responseStyleCopy,
      responseStylePreferences.handleFieldChange,
      responseStylePreferences.handleFieldCommit,
      responseStylePreferences.handleRetry,
      responseStylePreferences.state,
      subscriptionSection,
      translations,
    ],
  );
