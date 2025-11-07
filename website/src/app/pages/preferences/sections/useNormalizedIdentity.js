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
