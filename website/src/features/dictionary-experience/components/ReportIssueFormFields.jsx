import PropTypes from "prop-types";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import ReportIssueSummary from "./ReportIssueSummary.jsx";
import styles from "./ReportIssueModal.module.css";

const TEXTAREA_ID = "report-description";

const segmentedControlPropTypes = PropTypes.shape({
  labelledBy: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  wrap: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
});

export function ReportIssueCategoryFieldset({
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

export function ReportIssueDescriptionField({
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

function ReportIssueFields({
  legendId,
  strings,
  segmentedControlProps,
  summaryItems,
  description,
  submitting,
  onDescriptionChange,
}) {
  return (
    <>
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
    </>
  );
}

ReportIssueCategoryFieldset.propTypes = {
  legendId: PropTypes.string.isRequired,
  strings: PropTypes.shape({
    categoryLabel: PropTypes.string.isRequired,
  }).isRequired,
  segmentedControlProps: segmentedControlPropTypes.isRequired,
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

ReportIssueFields.propTypes = {
  legendId: PropTypes.string.isRequired,
  strings: PropTypes.shape({
    categoryLabel: PropTypes.string.isRequired,
    descriptionLabel: PropTypes.string.isRequired,
    descriptionPlaceholder: PropTypes.string.isRequired,
  }).isRequired,
  segmentedControlProps: segmentedControlPropTypes.isRequired,
  summaryItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    }).isRequired,
  ).isRequired,
  description: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
};

export default ReportIssueFields;
