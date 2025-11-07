import PropTypes from "prop-types";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import { normalizeLanguageValue } from "./dataSectionToolkit.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

export const HistoryCaptureField = ({ fieldId, copy, control, styles }) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {copy.label}
    </legend>
    <p className={styles.description}>{copy.description}</p>
    <SegmentedControl
      labelledBy={fieldId}
      options={control.options}
      value={control.value}
      onChange={control.onChange}
    />
  </fieldset>
);

HistoryCaptureField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
          .isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  styles: PropTypes.object.isRequired,
};

export const RetentionField = ({
  fieldId,
  copy,
  control,
  isPending,
  styles,
}) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {copy.label}
    </legend>
    <p className={styles.description}>{copy.description}</p>
    <SegmentedControl
      labelledBy={fieldId}
      options={control.options}
      value={control.value}
      onChange={control.onChange}
      disabled={isPending}
    />
  </fieldset>
);

RetentionField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        days: PropTypes.number,
      }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  isPending: PropTypes.bool,
  styles: PropTypes.object.isRequired,
};

RetentionField.defaultProps = {
  isPending: false,
};

export const LanguageHistoryField = ({
  fieldId,
  copy,
  control,
  isPending,
  styles,
}) => (
  <div className={styles["control-field"]}>
    <label htmlFor={fieldId} className={styles["control-label"]}>
      {copy.label}
    </label>
    <p className={styles.description}>{copy.description}</p>
    {control.options.length > 0 ? (
      <div className={styles["language-shell"]}>
        <LanguageMenu
          id={fieldId}
          options={control.options}
          value={control.value}
          onChange={control.onChange}
          ariaLabel={copy.label}
          normalizeValue={normalizeLanguageValue}
          showLabel
          fullWidth
        />
      </div>
    ) : (
      <p className={styles.description}>{copy.placeholder}</p>
    )}
    <div className={styles["subscription-current-actions"]}>
      <button
        type="button"
        className={styles["subscription-action"]}
        onClick={control.onClear}
        disabled={!control.canClear || isPending}
      >
        {copy.clearLabel}
      </button>
    </div>
  </div>
);

LanguageHistoryField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    clearLabel: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    canClear: PropTypes.bool.isRequired,
  }).isRequired,
  isPending: PropTypes.bool.isRequired,
  styles: PropTypes.object.isRequired,
};

export const DataActionsField = ({ copy, control, isClearingAll, styles }) => (
  <div className={styles["control-field"]}>
    <span className={styles["control-label"]}>{copy.label}</span>
    <p className={styles.description}>{copy.description}</p>
    <div className={styles["subscription-current-actions"]}>
      <button
        type="button"
        className={composeClassName(
          styles["subscription-action"],
          styles["subscription-action-danger"],
        )}
        onClick={control.onClearAll}
        disabled={!control.canClearAll || isClearingAll}
      >
        {copy.clearAllLabel}
      </button>
      <button
        type="button"
        className={styles["subscription-action"]}
        onClick={control.onExport}
      >
        {copy.exportLabel}
      </button>
    </div>
  </div>
);

DataActionsField.propTypes = {
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    clearAllLabel: PropTypes.string.isRequired,
    exportLabel: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    onClearAll: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    canClearAll: PropTypes.bool.isRequired,
  }).isRequired,
  isClearingAll: PropTypes.bool.isRequired,
  styles: PropTypes.object.isRequired,
};
