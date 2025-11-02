/**
 * 背景：
 *  - 语言筛选依赖历史记录与翻译文案，原逻辑散落在组件中，影响重用能力。
 * 目的：
 *  - 以 Hook 抽象语言选项推导与选择状态，确保控制器与视图均可复用。
 * 关键决策与取舍：
 *  - 使用 useMemo 缓存选项列表，避免历史列表变化频繁时重复计算；
 *  - 统一在此归一化语言标识，避免视图层重复引入工具函数。
 * 影响范围：
 *  - 偏好设置数据分区的语言过滤；
 *  - 未来如需提供全局语言快捷清理，可直接复用该 Hook。
 * 演进与TODO：
 *  - TODO: 支持多选场景时，可在此扩展返回批量清理接口。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  normalizeLanguageValue,
  toLanguageOptions,
} from "./dataSectionToolkit.js";

export const useDataSectionLanguageSelection = (history, translations) => {
  const options = useMemo(
    () => toLanguageOptions(history, translations),
    [history, translations],
  );

  const [selectedLanguage, setSelectedLanguage] = useState(
    () => options[0]?.value ?? "",
  );

  useEffect(() => {
    if (options.length === 0) {
      setSelectedLanguage("");
      return;
    }
    setSelectedLanguage((current) =>
      options.some((option) => option.value === current)
        ? current
        : options[0].value,
    );
  }, [options]);

  const selectLanguage = useCallback((language) => {
    setSelectedLanguage(normalizeLanguageValue(language));
  }, []);

  const canClear = Boolean(
    normalizeLanguageValue(selectedLanguage) && options.length > 0,
  );

  return {
    options,
    selectedLanguage,
    selectLanguage,
    canClear,
  };
};
