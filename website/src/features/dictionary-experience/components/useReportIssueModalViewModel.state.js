/**
 * 背景：
 *  - useReportIssueModalViewModel 的衍生逻辑逐渐增多，直接内联导致文件行数膨胀。
 * 目的：
 *  - 提供聚合的状态派生 Hook 集合，供主 ViewModel 组合使用，保持单一职责。
 * 关键决策与取舍：
 *  - 将 handler、语言上下文、摘要、文案、SegmentedControl 等拆分为独立小 Hook；
 *  - 保持纯 Hook 组合，避免引入新的状态管理依赖。
 * 影响范围：
 *  - 举报弹窗 ViewModel 的内部实现结构。
 * 演进与TODO：
 *  - 后续可引入测试专用桩，针对各 Hook 单独验证依赖组合。
 */
import { useCallback, useMemo } from "react";
import {
  buildModalStrings,
  buildSummaryItems,
  createCategoryOptions,
  createLanguageLabels,
  resolveLanguageContext,
} from "./reportIssueModalViewModel.helpers";

export const useReportIssueHandlers = (onSubmit, onClose, submitting) => {
  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (submitting) return;
      onSubmit?.();
    },
    [onSubmit, submitting],
  );

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return { handleSubmit, handleClose };
};

export const useLanguageContextState = ({
  language,
  flavor,
  sourceLanguage,
  targetLanguage,
  translations,
}) => {
  const languageLabels = useMemo(() => createLanguageLabels(translations), [translations]);
  return useMemo(
    () =>
      resolveLanguageContext({
        language,
        flavor,
        sourceLanguage,
        targetLanguage,
        languageLabels,
      }),
    [language, flavor, sourceLanguage, targetLanguage, languageLabels],
  );
};

export const useCategoryOptionsState = (categories, translations) =>
  useMemo(() => createCategoryOptions(categories, translations), [categories, translations]);

export const useSummaryItemsState = (term, language, translations, languageContext) =>
  useMemo(
    () =>
      buildSummaryItems({
        term,
        language,
        resolvedLanguageLabel: languageContext.resolvedLanguageLabel,
        dictionaryModeLabel: languageContext.dictionaryModeLabel,
        translations,
      }),
    [
      term,
      language,
      translations,
      languageContext.dictionaryModeLabel,
      languageContext.resolvedLanguageLabel,
    ],
  );

export const useStringsState = (translations, error) =>
  useMemo(() => buildModalStrings(translations, error), [translations, error]);

export const useSegmentedControlPropsState = (
  legendId,
  categoryOptions,
  category,
  onCategoryChange,
  submitting,
) =>
  useMemo(
    () => ({
      labelledBy: legendId,
      options: categoryOptions,
      value: category,
      onChange: onCategoryChange,
      wrap: true,
      disabled: submitting,
    }),
    [legendId, categoryOptions, category, onCategoryChange, submitting],
  );
