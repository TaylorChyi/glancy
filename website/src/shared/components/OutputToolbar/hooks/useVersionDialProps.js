/**
 * 背景：
 *  - 版本拨盘需要组合多项指标与回调，直接在组件中处理导致重复代码。
 * 目的：
 *  - 提供统一 Hook 输出拨盘渲染所需的 props。
 * 关键决策与取舍：
 *  - 使用 useMemo 缓存对象，避免子组件重复渲染；
 *  - 仅处理结构化数据，不引入额外业务判断。
 * 影响范围：
 *  - VersionDial 组件。
 * 演进与TODO：
 *  - 如需拓展更多拨盘信息，可在此扩展返回字段。
 */
import { useMemo } from "react";

export const useVersionDialProps = ({
  versionViewModel,
  baseToolButtonClass,
  onNavigate,
  translator,
}) => {
  const { hasPrevious, hasNext, indicator, pagerLabel, disabled } =
    versionViewModel;
  return useMemo(
    () => ({
      baseToolButtonClass,
      hasPrevious,
      hasNext,
      disabled,
      onNavigate,
      previousLabel: translator.previousVersion,
      nextLabel: translator.nextVersion,
      indicator,
      pagerLabel,
    }),
    [
      baseToolButtonClass,
      hasPrevious,
      hasNext,
      disabled,
      onNavigate,
      translator.previousVersion,
      translator.nextVersion,
      indicator,
      pagerLabel,
    ],
  );
};
