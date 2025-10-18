/**
 * 背景：
 *  - 面板元数据生成此前嵌在主 Hook 中，导致依赖链混乱且圈复杂度偏高。
 * 目的：
 *  - 通过专用 Hook 提供可复用的面板元数据，确保依赖稳定、逻辑集中。
 * 关键决策与取舍：
 *  - 使用 useMemo 结合 createPanelMetadata，避免不必要的重算。
 * 影响范围：
 *  - 偏好设置页面及模态中的面板容器。
 * 演进与TODO：
 *  - 后续可在此拓展多语言辅助说明或可访问性增强策略。
 */
import { useMemo } from "react";
import { createPanelMetadata } from "./utils/createPanelMetadata.js";

export const usePreferencePanel = ({ activeSection, modalTitle }) =>
  useMemo(
    () => createPanelMetadata({ activeSection, modalTitle }),
    [activeSection, modalTitle],
  );
