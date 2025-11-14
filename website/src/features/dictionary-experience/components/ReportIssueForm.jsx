import { useCallback } from "react";
import PropTypes from "prop-types";
import { SettingsSurface } from "@shared/components";
import ReportIssueActionBar from "./ReportIssueActionBar.jsx";
import ReportIssueModalHeader from "./ReportIssueModalHeader.jsx";
import ReportIssueFields from "./ReportIssueFormFields.jsx";
import styles from "./ReportIssueModal.module.css";

/**
 * 意图：渲染举报弹窗内部表单结构，组合摘要、分类与描述输入。
 * 输入：ViewModel 提供的 id、派生文案与回调。
 * 输出：用于 BaseModal 内容区域的 SettingsSurface 实例。
 * 复杂度：O(n)，受摘要条目数量影响。
 */
const useReportIssueHeaderRenderer = (handleClose, closeLabel) =>
  useCallback(
    ({ headingId: surfaceHeadingId, title }) => (
      <ReportIssueModalHeader
        headingId={surfaceHeadingId}
        title={title}
        closeLabel={closeLabel}
        onClose={handleClose}
      />
    ),
    [handleClose, closeLabel],
  );

function ReportIssueSurface({
  headingId,
  handleSubmit,
  strings,
  renderHeader,
  actions,
  children,
}) {
  return (
    <SettingsSurface
      as="form"
      onSubmit={handleSubmit}
      title={strings.title}
      headingId={headingId}
      renderHeader={renderHeader}
      actions={actions}
      className={styles["plain-surface"]}
    >
      {children}
    </SettingsSurface>
  );
}

ReportIssueSurface.propTypes = {
  headingId: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  strings: PropTypes.shape({
    title: PropTypes.string.isRequired,
  }).isRequired,
  renderHeader: PropTypes.func.isRequired,
  actions: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

function ReportIssueActions({ strings, submitting, onCancel }) {
  return (
    <ReportIssueActionBar
      className={styles["action-bar"]}
      errorMessage={strings.errorMessage}
      submitting={submitting}
      labels={{
        cancel: strings.cancelLabel,
        submit: strings.submitLabel,
        submitting: strings.submittingLabel,
      }}
      onCancel={onCancel}
    />
  );
}

const createFieldsProps = ({
  legendId,
  strings,
  segmentedControlProps,
  summaryItems,
  description,
  submitting,
  onDescriptionChange,
}) => ({
  legendId,
  strings,
  segmentedControlProps,
  summaryItems,
  description,
  submitting,
  onDescriptionChange,
});

const createActionsElement = ({ strings, submitting, handleClose }) => (
  <ReportIssueActions
    strings={strings}
    submitting={submitting}
    onCancel={handleClose}
  />
);

const renderReportIssueFields = (fieldsProps) => (
  <ReportIssueFields {...createFieldsProps(fieldsProps)} />
);

const renderReportIssueSurface = ({
  headingId,
  handleSubmit,
  strings,
  renderHeader,
  submitting,
  handleClose,
  ...fieldsProps
}) => (
  <ReportIssueSurface
    headingId={headingId}
    handleSubmit={handleSubmit}
    strings={strings}
    renderHeader={renderHeader}
    actions={createActionsElement({ strings, submitting, handleClose })}
  >
    {renderReportIssueFields({ ...fieldsProps, strings, submitting })}
  </ReportIssueSurface>
);

ReportIssueActions.propTypes = {
  strings: PropTypes.shape({
    errorMessage: PropTypes.string.isRequired,
    cancelLabel: PropTypes.string.isRequired,
    submitLabel: PropTypes.string.isRequired,
    submittingLabel: PropTypes.string.isRequired,
  }).isRequired,
  submitting: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function ReportIssueFormView({
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
  const renderHeader = useReportIssueHeaderRenderer(
    handleClose,
    strings.closeLabel,
  );
  return renderReportIssueSurface({
    headingId,
    handleSubmit,
    strings,
    renderHeader,
    submitting,
    handleClose,
    legendId,
    segmentedControlProps,
    summaryItems,
    description,
    onDescriptionChange,
  });
}

function ReportIssueForm(props) {
  return <ReportIssueFormView {...props} />;
}

ReportIssueFormView.propTypes = {
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
    ReportIssueFields.propTypes.segmentedControlProps,
  submitting: PropTypes.bool.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
};

ReportIssueForm.propTypes = ReportIssueFormView.propTypes;

export default ReportIssueForm;
