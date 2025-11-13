import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import SelectMenu from "@shared/components/ui/SelectMenu";
import styles from "../../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const PlaceholderMessage = ({ placeholder }) =>
  placeholder.visible ? (
    <p className={styles.placeholder}>{placeholder.label}</p>
  ) : null;

const ErrorMessage = ({ error }) =>
  error.visible ? (
    <div role="alert" className={styles["detail-row"]}>
      <p className={styles.placeholder}>{error.label}</p>
      <div />
      <div className={styles["detail-action"]}>
        {error.onRetry ? (
          <button
            type="button"
            className={composeClassName(
              styles["avatar-trigger"],
              styles["detail-action-button"],
            )}
            onClick={error.onRetry}
          >
            {error.retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  ) : null;

const DetailRow = ({ children }) => (
  <div className={styles["detail-row"]}>{children}</div>
);

const DetailLabel = ({ htmlFor, children }) => (
  <dt className={styles["detail-label"]}>
    <label htmlFor={htmlFor}>{children}</label>
  </dt>
);

const DetailValue = ({
  interactive,
  hasArrow,
  children,
}) => (
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

const DetailAction = ({ children }) => (
  <div className={styles["detail-action"]} aria-live="polite">
    {children}
  </div>
);

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

const FieldControl = ({ field }) => {
  const controlClass = composeClassName(
    styles["field-control"],
    field.multiline
      ? styles["field-control-textarea"]
      : styles["field-control-input"],
  );
  if (field.multiline) {
    return (
      <textarea
        id={field.inputId}
        className={controlClass}
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        placeholder={field.placeholder}
        rows={field.rows ?? 3}
      />
    );
  }
  return (
    <input
      id={field.inputId}
      type="text"
      className={controlClass}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      placeholder={field.placeholder}
    />
  );
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

const FieldsPanel = ({ dropdown, fields, savingLabel }) => {
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

function ResponseStyleSectionView({
  section,
  placeholder,
  error,
  dropdown,
  fields,
  savingLabel,
}) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      description={section.description}
      descriptionId={section.descriptionId}
      classes={{
        section: composeClassName(styles.section, styles["section-plain"]),
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
        description: styles["section-description"],
      }}
    >
      <div aria-live="polite" className={styles.details}>
        <PlaceholderMessage placeholder={placeholder} />
        <ErrorMessage error={error} />
        <FieldsPanel
          dropdown={dropdown}
          fields={fields}
          savingLabel={savingLabel}
        />
      </div>
    </SettingsSection>
  );
}

const optionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

ResponseStyleSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    descriptionId: PropTypes.string,
  }).isRequired,
  placeholder: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  error: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    retryLabel: PropTypes.string.isRequired,
    onRetry: PropTypes.oneOfType([PropTypes.func, PropTypes.oneOf([null])]),
  }).isRequired,
  dropdown: PropTypes.shape({
    selectId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(optionShape).isRequired,
    value: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
    isSaving: PropTypes.bool.isRequired,
  }),
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      inputId: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      multiline: PropTypes.bool,
      rows: PropTypes.number,
      value: PropTypes.string.isRequired,
      onChange: PropTypes.func.isRequired,
      onBlur: PropTypes.func.isRequired,
      isSaving: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  savingLabel: PropTypes.string.isRequired,
};

ResponseStyleSectionView.defaultProps = {
  dropdown: null,
};

export default ResponseStyleSectionView;
