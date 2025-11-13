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

const useReportIssueLanguageContext = ({
  language,
  flavor,
  sourceLanguage,
  targetLanguage,
  translations,
}) =>
  useLanguageContextState({
    language,
    flavor,
    sourceLanguage,
    targetLanguage,
    translations,
  });

const useReportIssueSummaryItems = ({
  term,
  language,
  translations,
  languageContext,
}) => useSummaryItemsState(term, language, translations, languageContext);

const useReportIssueSegmentedControlProps = ({
  legendId,
  categoryOptions,
  category,
  onCategoryChange,
  submitting,
}) =>
  useSegmentedControlPropsState(
    legendId,
    categoryOptions,
    category,
    onCategoryChange,
    submitting,
  );

const buildReportIssueSurfaceDependencies = ({
  summaryItems,
  segmentedControlProps,
  strings,
}) => ({ summaryItems, segmentedControlProps, strings });

const useReportIssueSurfaceDependencies = (props) => {
  const languageContext = useReportIssueLanguageContext(props);
  const categoryOptions = useCategoryOptionsState(
    props.categories,
    props.translations,
  );
  const summaryItems = useReportIssueSummaryItems({
    term: props.term,
    language: props.language,
    translations: props.translations,
    languageContext,
  });
  const strings = useStringsState(props.translations, props.error);
  const segmentedControlProps = useReportIssueSegmentedControlProps({
    legendId: props.legendId,
    categoryOptions,
    category: props.category,
    onCategoryChange: props.onCategoryChange,
    submitting: props.submitting,
  });

  return buildReportIssueSurfaceDependencies({
    summaryItems,
    segmentedControlProps,
    strings,
  });
};

const createReportIssueModalViewModel = ({
  headingId,
  legendId,
  handleSubmit,
  handleClose,
  surfaceDependencies,
  description,
  submitting,
  onDescriptionChange,
}) => ({
  headingId,
  legendId,
  handleSubmit,
  handleClose,
  summaryItems: surfaceDependencies.summaryItems,
  segmentedControlProps: surfaceDependencies.segmentedControlProps,
  strings: surfaceDependencies.strings,
  description,
  submitting,
  onDescriptionChange,
  modalClassName: `modal-content ${styles["modal-shell"]}`,
});

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
  const surfaceDependencies = useReportIssueSurfaceDependencies({
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

  return createReportIssueModalViewModel({
    headingId,
    legendId,
    handleSubmit,
    handleClose,
    surfaceDependencies,
    description,
    submitting,
    onDescriptionChange,
  });
};
