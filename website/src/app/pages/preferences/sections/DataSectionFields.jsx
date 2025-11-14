import PropTypes from "prop-types";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import { normalizeLanguageValue } from "./dataSectionToolkit.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const segmentedControlShape = PropTypes.shape({
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
      days: PropTypes.number,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
});

const fieldCopyShape = PropTypes.shape({
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
});

const FieldsetContainer = ({ fieldId, label, description, styles, children }) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {label}
    </legend>
    <p className={styles.description}>{description}</p>
    {children}
  </fieldset>
);

FieldsetContainer.propTypes = {
  fieldId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

const SegmentedSelector = ({ fieldId, control, disabled }) => (
  <SegmentedControl
    labelledBy={fieldId}
    options={control.options}
    value={control.value}
    onChange={control.onChange}
    disabled={disabled}
  />
);

SegmentedSelector.propTypes = {
  fieldId: PropTypes.string.isRequired,
  control: segmentedControlShape.isRequired,
  disabled: PropTypes.bool,
};

SegmentedSelector.defaultProps = {
  disabled: false,
};

export const HistoryCaptureField = ({ fieldId, copy, control, styles }) => (
  <FieldsetContainer
    fieldId={fieldId}
    label={copy.label}
    description={copy.description}
    styles={styles}
  >
    <SegmentedSelector fieldId={fieldId} control={control} />
  </FieldsetContainer>
);

HistoryCaptureField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: fieldCopyShape.isRequired,
  control: segmentedControlShape.isRequired,
  styles: PropTypes.object.isRequired,
};

export const RetentionField = ({
  fieldId,
  copy,
  control,
  isPending,
  styles,
}) => (
  <FieldsetContainer
    fieldId={fieldId}
    label={copy.label}
    description={copy.description}
    styles={styles}
  >
    <SegmentedSelector fieldId={fieldId} control={control} disabled={isPending} />
  </FieldsetContainer>
);

RetentionField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: fieldCopyShape.isRequired,
  control: segmentedControlShape.isRequired,
  isPending: PropTypes.bool,
  styles: PropTypes.object.isRequired,
};

RetentionField.defaultProps = {
  isPending: false,
};

const LanguageContainer = ({ styles, children }) => (
  <div className={styles["control-field"]}>{children}</div>
);

LanguageContainer.propTypes = {
  styles: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

const LanguageSelect = ({ fieldId, control, copy, styles }) => {
  if (control.options.length === 0) {
    return <p className={styles.description}>{copy.placeholder}</p>;
  }
  return (
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
  );
};

LanguageSelect.propTypes = {
  fieldId: PropTypes.string.isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
  }).isRequired,
  styles: PropTypes.object.isRequired,
};

const LanguageActionButton = ({ copy, control, isPending, styles }) => (
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
);

LanguageActionButton.propTypes = {
  copy: PropTypes.shape({
    clearLabel: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    onClear: PropTypes.func.isRequired,
    canClear: PropTypes.bool.isRequired,
  }).isRequired,
  isPending: PropTypes.bool.isRequired,
  styles: PropTypes.object.isRequired,
};

export const LanguageHistoryField = ({
  fieldId,
  copy,
  control,
  isPending,
  styles,
}) => (
  <LanguageContainer styles={styles}>
    <label htmlFor={fieldId} className={styles["control-label"]}>
      {copy.label}
    </label>
    <p className={styles.description}>{copy.description}</p>
    <LanguageSelect
      fieldId={fieldId}
      control={control}
      copy={copy}
      styles={styles}
    />
    <LanguageActionButton
      copy={copy}
      control={control}
      isPending={isPending}
      styles={styles}
    />
  </LanguageContainer>
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

const ActionsContainer = ({ styles, children }) => (
  <div className={styles["control-field"]}>{children}</div>
);

ActionsContainer.propTypes = {
  styles: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

const ActionsButtons = ({ styles, children }) => (
  <div className={styles["subscription-current-actions"]}>{children}</div>
);

ActionsButtons.propTypes = {
  styles: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

const ActionButton = ({
  label,
  onClick,
  disabled,
  variant,
  styles,
}) => (
  <button
    type="button"
    className={composeClassName(
      styles["subscription-action"],
      variant === "danger" ? styles["subscription-action-danger"] : "",
    )}
    onClick={onClick}
    disabled={disabled}
  >
    {label}
  </button>
);

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(["default", "danger"]),
  styles: PropTypes.object.isRequired,
};

ActionButton.defaultProps = {
  disabled: false,
  variant: "default",
};

export const DataActionsField = ({ copy, control, isClearingAll, styles }) => (
  <ActionsContainer styles={styles}>
    <span className={styles["control-label"]}>{copy.label}</span>
    <p className={styles.description}>{copy.description}</p>
    <ActionsButtons styles={styles}>
      <ActionButton
        label={copy.clearAllLabel}
        onClick={control.onClearAll}
        disabled={!control.canClearAll || isClearingAll}
        variant="danger"
        styles={styles}
      />
      <ActionButton
        label={copy.exportLabel}
        onClick={control.onExport}
        styles={styles}
      />
    </ActionsButtons>
  </ActionsContainer>
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
