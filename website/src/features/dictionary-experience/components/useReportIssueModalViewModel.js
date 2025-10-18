/**
 * 背景：
 *  - 举报弹窗的派生逻辑（翻译、语言推断、分类配置）高度耦合在组件内部，难以扩展。
 * 目的：
 *  - 通过可复用的 ViewModel Hook 聚合派生状态，降低 UI 组件复杂度并满足结构化 lint 约束。
 * 关键决策与取舍：
 *  - 拆分细粒度 Hook（useMemo 包装）以降低主 Hook 体量与复杂度；
 *  - 返回纯数据与回调，由 UI 再组合，遵循容器/展示分离原则。
 * 影响范围：
 *  - 举报弹窗所有派生文案、语言上下文与分类选项。
 * 演进与TODO：
 *  - 可接入状态机管理提交态或引入多语言配置同步机制。
 */
import { useCallback, useId } from "react";
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

const useReportIssueHeaderRenderer = (handleClose, closeLabel) =>
  useCallback(
    ({ headingId: surfaceHeadingId, title }) => (
      <header className={styles.header}>
        <button
          type="button"
          className={styles["header-close"]}
          aria-label={closeLabel}
          onClick={handleClose}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <h2 id={surfaceHeadingId} className={styles["header-title"]}>
          {title}
        </h2>
        <span aria-hidden="true" className={styles["header-spacer"]} />
      </header>
    ),
    [closeLabel, handleClose],
  );

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
  const renderHeader = useReportIssueHeaderRenderer(
    handleClose,
    strings.closeLabel,
  );

  return {
    headingId,
    legendId,
    handleSubmit,
    handleClose,
    renderHeader,
    summaryItems,
    segmentedControlProps,
    strings,
    description,
    submitting,
    onDescriptionChange,
    modalClassName: `modal-content ${styles["modal-shell"]}`,
  };
};
