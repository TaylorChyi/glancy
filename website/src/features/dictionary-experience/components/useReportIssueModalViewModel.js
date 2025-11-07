import { useId } from "react";
import { useLanguage } from "@core/context";
import styles from "./ReportIssueModal.module.css";
import {
  useCategoryOptionsState,
  useLanguageContextState,
  useReportIssueHandlers,
  useSegmentedControlPropsState,
  useStringsState,
  useSummaryItemsState,
} from "./useReportIssueModalViewModel.state";

const useReportIssueSurfaceDependencies = ({
  categories,
  category,
  error,
  legendId,
  language,
  flavor,
  sourceLanguage,
  targetLanguage,
  term,
  onCategoryChange,
  submitting,
  translations,
}) => {
  const languageContext = useLanguageContextState({
    language,
    flavor,
    sourceLanguage,
    targetLanguage,
    translations,
  });
  const categoryOptions = useCategoryOptionsState(categories, translations);
  const summaryItems = useSummaryItemsState(
    term,
    language,
    translations,
    languageContext,
  );
  const strings = useStringsState(translations, error);
  const segmentedControlProps = useSegmentedControlPropsState(
    legendId,
    categoryOptions,
    category,
    onCategoryChange,
    submitting,
  );

  return { summaryItems, segmentedControlProps, strings };
};

export const useReportIssueModalViewModel = ({
  categories,
  category,
  description,
  submitting,
  error,
  term,
  language,
  flavor,
  sourceLanguage,
  targetLanguage,
  onClose,
  onCategoryChange,
  onDescriptionChange,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const headingId = useId();
  const legendId = useId();
  const { handleSubmit, handleClose } = useReportIssueHandlers(
    onSubmit,
    onClose,
    submitting,
  );
  const { summaryItems, segmentedControlProps, strings } =
    useReportIssueSurfaceDependencies({
      categories,
      category,
      error,
      legendId,
      language,
      flavor,
      sourceLanguage,
      targetLanguage,
      term,
      onCategoryChange,
      submitting,
      translations: t,
    });
  return {
    headingId,
    legendId,
    handleSubmit,
    handleClose,
    summaryItems,
    segmentedControlProps,
    strings,
    description,
    submitting,
    onDescriptionChange,
    modalClassName: `modal-content ${styles["modal-shell"]}`,
  };
};
