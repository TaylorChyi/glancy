import { useCallback } from "react";
import PropTypes from "prop-types";
import { SettingsSurface } from "@shared/components";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import ReportIssueActionBar from "./ReportIssueActionBar.jsx";
import ReportIssueSummary from "./ReportIssueSummary.jsx";
import ReportIssueModalHeader from "./ReportIssueModalHeader.jsx";
import styles from "./ReportIssueModal.module.css";

const TEXTAREA_ID = "report-description";

/**
 * 意图：呈现举报分类选择，封装 SegmentedControl 的结构与 aria 语义。
 * 输入：legendId、翻译文案与分段控制 props。
 * 输出：具备 legend 与选项的 fieldset。
 * 复杂度：O(1)。
 */
function ReportIssueCategoryFieldset({
  legendId,
  strings,
  segmentedControlProps,
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend id={legendId} className={styles.legend}>
        {strings.categoryLabel}
      </legend>
      <SegmentedControl
        {...segmentedControlProps}
        aria-label={strings.categoryLabel}
      />
    </fieldset>
  );
}

/**
 * 意图：渲染描述输入区域，复用统一的 label 与占位符策略。
 * 输入：翻译文案、描述值、提交态与变更回调。
 * 输出：包含 label 与 textarea 的表单片段。
 * 复杂度：O(1)。
 */
function ReportIssueDescriptionField({
  strings,
  description,
  submitting,
  onDescriptionChange,
}) {
  return (
    <div className={styles.fieldset}>
      <label htmlFor={TEXTAREA_ID} className={styles.legend}>
        {strings.descriptionLabel}
      </label>
      <textarea
        id={TEXTAREA_ID}
        className={styles.textarea}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder={strings.descriptionPlaceholder}
        rows={4}
        disabled={submitting}
      />
    </div>
  );
}

/**
 * 意图：渲染举报弹窗内部表单结构，组合摘要、分类与描述输入。
 * 输入：ViewModel 提供的 id、派生文案与回调。
 * 输出：用于 BaseModal 内容区域的 SettingsSurface 实例。
 * 复杂度：O(n)，受摘要条目数量影响。
 */
function ReportIssueForm({
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
}) {
  const renderHeader = useCallback(
    ({ headingId: surfaceHeadingId, title }) => (
      <ReportIssueModalHeader
        headingId={surfaceHeadingId}
        title={title}
        closeLabel={strings.closeLabel}
        onClose={handleClose}
      />
    ),
    [handleClose, strings.closeLabel],
  );

  return (
    <SettingsSurface
      as="form"
      onSubmit={handleSubmit}
      title={strings.title}
      headingId={headingId}
      renderHeader={renderHeader}
      actions={
        <ReportIssueActionBar
          className={styles["action-bar"]}
          errorMessage={strings.errorMessage}
          submitting={submitting}
          labels={{
            cancel: strings.cancelLabel,
            submit: strings.submitLabel,
            submitting: strings.submittingLabel,
          }}
          onCancel={handleClose}
        />
      }
      className={styles["plain-surface"]}
    >
      <ReportIssueSummary items={summaryItems} />
      <ReportIssueCategoryFieldset
        legendId={legendId}
        strings={strings}
        segmentedControlProps={segmentedControlProps}
      />
      <ReportIssueDescriptionField
        strings={strings}
        description={description}
        submitting={submitting}
        onDescriptionChange={onDescriptionChange}
      />
    </SettingsSurface>
  );
}

ReportIssueCategoryFieldset.propTypes = {
  legendId: PropTypes.string.isRequired,
  strings: PropTypes.shape({
    categoryLabel: PropTypes.string.isRequired,
  }).isRequired,
  segmentedControlProps: PropTypes.shape({
    labelledBy: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    wrap: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
  }).isRequired,
};

ReportIssueDescriptionField.propTypes = {
  strings: PropTypes.shape({
    descriptionLabel: PropTypes.string.isRequired,
    descriptionPlaceholder: PropTypes.string.isRequired,
  }).isRequired,
  description: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
};

ReportIssueForm.propTypes = {
  headingId: PropTypes.string.isRequired,
  legendId: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  summaryItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    }).isRequired,
  ).isRequired,
  strings: PropTypes.shape({
    title: PropTypes.string.isRequired,
    categoryLabel: PropTypes.string.isRequired,
    descriptionLabel: PropTypes.string.isRequired,
    descriptionPlaceholder: PropTypes.string.isRequired,
    cancelLabel: PropTypes.string.isRequired,
    submitLabel: PropTypes.string.isRequired,
    submittingLabel: PropTypes.string.isRequired,
    closeLabel: PropTypes.string.isRequired,
    errorMessage: PropTypes.string.isRequired,
  }).isRequired,
  description: PropTypes.string.isRequired,
  segmentedControlProps:
    ReportIssueCategoryFieldset.propTypes.segmentedControlProps,
  submitting: PropTypes.bool.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
};

export default ReportIssueForm;
