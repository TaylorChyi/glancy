import PropTypes from "prop-types";
import SelectMenu from "@shared/components/ui/SelectMenu";
import styles from "../../Preferences.module.css";
import { composeClassName } from "./composeClassName.js";
import {
  dropdownPropType,
  fieldPropType,
} from "./responseStylePropTypes.js";

const FieldControl = ({ field }) => {
  const controlClass = composeClassName(
    styles["field-control"],
    field.multiline
      ? styles["field-control-textarea"]
      : styles["field-control-input"],
  );
  const commonProps = {
    id: field.inputId,
    className: controlClass,
    value: field.value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    placeholder: field.placeholder,
  };
  return field.multiline ? (
    <textarea {...commonProps} rows={field.rows ?? 3} />
  ) : (
    <input {...commonProps} type="text" />
  );
};

FieldControl.propTypes = {
  field: PropTypes.shape({
    inputId: PropTypes.string.isRequired,
    multiline: PropTypes.bool,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    rows: PropTypes.number,
  }).isRequired,
};

const DetailRow = ({ children }) => (
  <div className={styles["detail-row"]}>{children}</div>
);

DetailRow.propTypes = {
  children: PropTypes.node.isRequired,
};

const DetailLabel = ({ htmlFor, children }) => (
  <dt className={styles["detail-label"]}>
    <label htmlFor={htmlFor}>{children}</label>
  </dt>
);

DetailLabel.propTypes = {
  htmlFor: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const DetailValue = ({ interactive, hasArrow, children }) => (
  <dd className={styles["detail-value"]}>
    <div
      className={styles["field-shell"]}
      data-interactive={interactive}
      data-has-arrow={hasArrow ? "true" : undefined}
    >
      {children}
    </div>
  </dd>
);

DetailValue.propTypes = {
  interactive: PropTypes.string,
  hasArrow: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

DetailValue.defaultProps = {
  interactive: undefined,
  hasArrow: false,
};

const DetailAction = ({ children }) => (
  <div className={styles["detail-action"]} aria-live="polite">
    {children}
  </div>
);

DetailAction.propTypes = {
  children: PropTypes.node,
};

DetailAction.defaultProps = {
  children: null,
};

const DropdownRow = ({ dropdown, savingLabel }) => {
  if (!dropdown) {
    return null;
  }

  return (
    <DetailRow>
      <DetailLabel htmlFor={dropdown.selectId}>{dropdown.label}</DetailLabel>
      <DetailValue interactive="menu" hasArrow>
        <SelectMenu
          id={dropdown.selectId}
          options={dropdown.options}
          value={dropdown.value}
          onChange={dropdown.onSelect}
          ariaLabel={dropdown.label}
          fullWidth
        />
      </DetailValue>
      <DetailAction>
        {dropdown.isSaving ? (
          <span className={styles.placeholder}>{savingLabel}</span>
        ) : null}
      </DetailAction>
    </DetailRow>
  );
};

DropdownRow.propTypes = {
  dropdown: dropdownPropType,
  savingLabel: PropTypes.string.isRequired,
};

DropdownRow.defaultProps = {
  dropdown: null,
};

const FieldRow = ({ field, savingLabel }) => (
  <DetailRow>
    <DetailLabel htmlFor={field.inputId}>{field.label}</DetailLabel>
    <DetailValue interactive={field.multiline ? "textarea" : "input"}>
      <FieldControl field={field} />
    </DetailValue>
    <DetailAction>
      {field.isSaving ? (
        <span className={styles.placeholder}>{savingLabel}</span>
      ) : null}
    </DetailAction>
  </DetailRow>
);

FieldRow.propTypes = {
  field: fieldPropType.isRequired,
  savingLabel: PropTypes.string.isRequired,
};

export const FieldsPanel = ({ dropdown, fields, savingLabel }) => {
  if (!dropdown && fields.length === 0) {
    return null;
  }

  return (
    <dl className={styles.details}>
      <DropdownRow dropdown={dropdown} savingLabel={savingLabel} />
      {fields.map((field) => (
        <FieldRow key={field.inputId} field={field} savingLabel={savingLabel} />
      ))}
    </dl>
  );
};

FieldsPanel.propTypes = {
  dropdown: dropdownPropType,
  fields: PropTypes.arrayOf(fieldPropType).isRequired,
  savingLabel: PropTypes.string.isRequired,
};
FieldsPanel.defaultProps = {
  dropdown: null,
};

