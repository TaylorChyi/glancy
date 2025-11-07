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
  const languageLabels = useMemo(
    () => createLanguageLabels(translations),
    [translations],
  );
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
  useMemo(
    () => createCategoryOptions(categories, translations),
    [categories, translations],
  );

export const useSummaryItemsState = (
  term,
  language,
  translations,
  languageContext,
) =>
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
