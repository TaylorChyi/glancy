/**
 * 背景：
 *  - DataSection 控制器需组合多段控制配置，如直接内联会导致文件体量超标。
 * 目的：
 *  - 将控制对象的构建抽离为独立 Hook，保持 `useDataSectionController` 精简。
 * 关键决策与取舍：
 *  - 依赖 dataSectionActions 提供的基础 handler，避免重复封装；
 *  - 各控制 Hook 输出统一结构（值、选项、动作、pendingId），便于视图层消费。
 * 影响范围：
 *  - 偏好设置数据分区的控制组合逻辑。
 * 演进与TODO：
 *  - TODO: 如需支持更多控制项，可在此文件新增对应 Hook 并保持接口一致。
 */

import { useCallback } from "react";
import {
  ACTION_CLEAR_ALL,
  ACTION_CLEAR_LANGUAGE,
  ACTION_RETENTION,
  useClearAllHandler,
  useClearLanguageHandler,
  useExportHandler,
  useHistoryToggleOptions,
  useRetentionHandler,
  useRetentionOptions,
} from "./dataSectionActions.js";

export const useHistoryToggleControl = ({
  copy,
  historyCaptureEnabled,
  setHistoryCaptureEnabled,
}) => {
  const options = useHistoryToggleOptions(copy.toggle);
  const handleToggleHistory = useCallback(
    (enabled) => setHistoryCaptureEnabled(enabled),
    [setHistoryCaptureEnabled],
  );
  return {
    value: historyCaptureEnabled,
    options,
    onChange: handleToggleHistory,
  };
};

export const useRetentionControl = ({
  retentionPolicyId,
  setRetentionPolicy,
  applyRetentionPolicy,
  runWithPending,
  user,
  translations,
}) => {
  const options = useRetentionOptions(translations);
  const handleRetentionSelect = useRetentionHandler({
    setRetentionPolicy,
    applyRetentionPolicy,
    runWithPending,
    user,
  });
  return {
    value: retentionPolicyId,
    options,
    onChange: handleRetentionSelect,
    pendingId: ACTION_RETENTION,
  };
};

export const useLanguageControl = ({
  copy,
  languageSelection,
  clearHistoryByLanguage,
  runWithPending,
  user,
}) => {
  const handleClearLanguage = useClearLanguageHandler({
    clearHistoryByLanguage,
    language: languageSelection.selectedLanguage,
    runWithPending,
    user,
  });
  return {
    copy: {
      ...copy.language,
      clearLabel: copy.actions.clearLanguageLabel,
    },
    value: languageSelection.selectedLanguage,
    options: languageSelection.options,
    onChange: languageSelection.selectLanguage,
    onClear: handleClearLanguage,
    canClear: languageSelection.canClear,
    pendingId: ACTION_CLEAR_LANGUAGE,
  };
};

export const useActionsControl = ({
  copy,
  history,
  clearHistory,
  runWithPending,
  user,
  translations,
}) => {
  const handleClearAll = useClearAllHandler({
    clearHistory,
    runWithPending,
    user,
  });
  const handleExport = useExportHandler({
    history,
    translations,
    fileName: copy.actions.fileName,
  });
  return {
    copy: {
      label: copy.actions.label,
      description: copy.actions.exportDescription,
      clearAllLabel: copy.actions.clearAllLabel,
      exportLabel: copy.actions.exportLabel,
    },
    onClearAll: handleClearAll,
    onExport: handleExport,
    canClearAll: history.length > 0,
    pendingId: ACTION_CLEAR_ALL,
  };
};
