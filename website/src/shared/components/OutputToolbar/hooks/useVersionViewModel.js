/**
 * 背景：
 *  - OutputToolbar 既要展示多版本的索引，又需保持界面克制不引入冗余控件。
 * 目的：
 *  - 将版本相关的衍生数据计算集中于纯函数 Hook，保持主组件精简且易于测试。
 * 关键决策与取舍：
 *  - 采用 ViewModel（MVVM 模式的查询端口）封装派生状态，避免在展示组件中散落 useMemo；
 *  - 鉴于翻页指示器已提供上下文，移除下拉菜单相关派生，降低视觉噪点。
 * 影响范围：
 *  - OutputToolbar 及后续可能复用版本拨盘的组件。
 * 演进与TODO：
 *  - 如需支持更多时间格式，可注入 formatter 策略以取代内置逻辑。
 */
import { useMemo } from "react";

const DEFAULT_INDICATOR_TEMPLATE = "{current} / {total}";
const DEFAULT_INDICATOR_EMPTY = "0 / 0";
const DEFAULT_PAGER_LABEL = "例句翻页";

const computePosition = (versions, activeVersionId) => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return { currentIndex: 0, total: 0 };
  }
  const resolvedIndex = versions.findIndex((item) => {
    const candidateId = item?.id ?? item?.versionId;
    if (candidateId == null) return false;
    return String(candidateId) === String(activeVersionId);
  });
  const index = resolvedIndex >= 0 ? resolvedIndex + 1 : versions.length;
  return { currentIndex: index, total: versions.length };
};

const resolveIndicator = ({ currentIndex, total }, translator) => {
  if (!total) {
    return translator.versionIndicatorEmpty || DEFAULT_INDICATOR_EMPTY;
  }
  const template = translator.versionIndicator || DEFAULT_INDICATOR_TEMPLATE;
  return template
    .replace("{current}", String(currentIndex))
    .replace("{total}", String(total));
};

/**
 * 意图：
 *  - 依据词条版本数据输出拨盘所需的派生信息。
 * 输入：
 *  - versions: 词条版本列表，可为空；
 *  - activeVersionId: 当前选中版本；
 *  - disabled: 工具栏禁用态；
 *  - translator: 本地化文案字典。
 * 输出：
 *  - 包含导航能力、指标文本等渲染所需数据。
 * 流程：
 *  1) 计算当前索引与总数；
 *  2) 组合导航按钮状态与指示器。
 * 复杂度：
 *  - O(n) 计算索引；额外空间 O(1)。
 */
export function useVersionViewModel({
  versions,
  activeVersionId,
  disabled,
  translator,
}) {
  const position = useMemo(
    () => computePosition(versions, activeVersionId),
    [versions, activeVersionId],
  );

  return {
    hasPrevious: position.total > 1 && position.currentIndex > 1,
    hasNext: position.total > 1 && position.currentIndex < position.total,
    indicator: resolveIndicator(position, translator),
    pagerLabel: translator.versionGroupLabel || DEFAULT_PAGER_LABEL,
    disabled: Boolean(disabled),
  };
}
