/**
 * 背景：
 *  - AccountSection 需要针对缺省 identity 信息填补默认值，历史实现直接写在组件内导致副作用分散。
 * 目的：
 *  - 提供纯函数化的 identity 归一化逻辑，保证标题、展示名与上传状态的一致性。
 * 关键决策与取舍：
 *  - 使用 useMemo 缓存结果，避免重复计算；
 *  - 默认文案与原实现保持一致，确保无文案回归。
 * 影响范围：
 *  - 头像区域的展示文案与状态。
 * 演进与TODO：
 *  - 若后续支持多语言覆盖，可在此接受 i18n key。
 */
import { useMemo } from "react";

const DEFAULT_AVATAR_LABEL = "Avatar";
const DEFAULT_CHANGE_LABEL = "Change avatar";

const takeOrFallback = (value, fallback) =>
  value === null || value === undefined ? fallback : value;

const toBoolean = (value) => Boolean(value);

const buildNormalizedIdentity = (identity, title) => {
  const safeIdentity = identity ?? {};
  const changeLabel = takeOrFallback(
    safeIdentity.changeLabel,
    DEFAULT_CHANGE_LABEL,
  );
  const labelFallback = takeOrFallback(
    safeIdentity.label,
    takeOrFallback(changeLabel, DEFAULT_AVATAR_LABEL),
  );

  return {
    label: labelFallback,
    displayName: takeOrFallback(safeIdentity.displayName, ""),
    changeLabel,
    avatarAlt: takeOrFallback(safeIdentity.avatarAlt, title),
    isUploading: toBoolean(safeIdentity.isUploading),
  };
};

/**
 * 意图：归一化 identity 数据结构，填充缺省文案。
 * 输入：identity —— 可能缺省部分字段的对象；title —— 分区标题，用作 avatar alt 兜底。
 * 输出：包含 label/displayName/changeLabel/avatarAlt/isUploading 的稳定对象。
 * 流程：
 *  1) 使用辅助函数处理缺省值与布尔转换；
 *  2) 依赖 identity 关键字段与 title 构建 memo 依赖列表。
 * 错误处理：输入为空时返回默认文案。
 * 复杂度：O(1)。
 */
export function useNormalizedIdentity(identity, title) {
  return useMemo(
    () => buildNormalizedIdentity(identity, title),
    [identity, title],
  );
}
