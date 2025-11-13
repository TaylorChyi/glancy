import PropTypes from "prop-types";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import { normalizeLanguageValue } from "./dataSectionToolkit.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const FieldDescription = ({ text, styles }) => (
  <p className={styles.description}>{text}</p>
);

FieldDescription.propTypes = {
  text: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired,
};

const FieldsetLayout = ({ fieldId, label, description, styles, children }) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {label}
    </legend>
    <FieldDescription text={description} styles={styles} />
    {children}
  </fieldset>
);

FieldsetLayout.propTypes = {
  fieldId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export const HistoryCaptureField = ({ fieldId, copy, control, styles }) => (
  <FieldsetLayout
    fieldId={fieldId}
    label={copy.label}
    description={copy.description}
    styles={styles}
  >
    <SegmentedControl
      labelledBy={fieldId}
      options={control.options}
      value={control.value}
      onChange={control.onChange}
    />
  </FieldsetLayout>
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
  <FieldsetLayout
    fieldId={fieldId}
    label={copy.label}
    description={copy.description}
    styles={styles}
  >
    <SegmentedControl
      labelledBy={fieldId}
      options={control.options}
      value={control.value}
      onChange={control.onChange}
      disabled={isPending}
    />
  </FieldsetLayout>
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

const LanguageMenuShell = ({ fieldId, copy, control, styles }) => (
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

LanguageMenuShell.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.array.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  styles: PropTypes.object.isRequired,
};

const LanguagePlaceholder = ({ placeholder, styles }) => (
  <FieldDescription text={placeholder} styles={styles} />
);

LanguagePlaceholder.propTypes = {
  placeholder: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired,
};

const LanguageActions = ({ copy, control, isPending, styles }) => (
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

LanguageActions.propTypes = {
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
  <div className={styles["control-field"]}>
    <label htmlFor={fieldId} className={styles["control-label"]}>
      {copy.label}
    </label>
    <FieldDescription text={copy.description} styles={styles} />
    {control.options.length > 0 ? (
      <LanguageMenuShell
        fieldId={fieldId}
        copy={copy}
        control={control}
        styles={styles}
      />
    ) : (
      <LanguagePlaceholder placeholder={copy.placeholder} styles={styles} />
    )}
    <LanguageActions
      copy={copy}
      control={control}
      isPending={isPending}
      styles={styles}
    />
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

const ActionButton = ({
  label,
  onClick,
  disabled,
  className,
}) => (
  <button type="button" className={className} onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string.isRequired,
};

ActionButton.defaultProps = {
  disabled: false,
};

const ActionGroup = ({ children, styles }) => (
  <div className={styles["subscription-current-actions"]}>{children}</div>
);

ActionGroup.propTypes = {
  children: PropTypes.node.isRequired,
  styles: PropTypes.object.isRequired,
};

export const DataActionsField = ({ copy, control, isClearingAll, styles }) => (
  <div className={styles["control-field"]}>
    <span className={styles["control-label"]}>{copy.label}</span>
    <FieldDescription text={copy.description} styles={styles} />
    <ActionGroup styles={styles}>
      <ActionButton
        label={copy.clearAllLabel}
        onClick={control.onClearAll}
        disabled={!control.canClearAll || isClearingAll}
        className={composeClassName(
          styles["subscription-action"],
          styles["subscription-action-danger"],
        )}
      />
      <ActionButton
        label={copy.exportLabel}
        onClick={control.onExport}
        className={styles["subscription-action"]}
      />
    </ActionGroup>
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
