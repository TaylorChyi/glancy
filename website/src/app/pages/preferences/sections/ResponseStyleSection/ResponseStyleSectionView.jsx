import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import SelectMenu from "@shared/components/ui/SelectMenu";
import styles from "../../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function ResponseStyleSectionView({
  section,
  placeholder,
  error,
  dropdown,
  fields,
  savingLabel,
}) {
  const shouldRenderFields = dropdown || fields.length > 0;
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
        {placeholder.visible ? (
          <p className={styles.placeholder}>{placeholder.label}</p>
        ) : null}
        {error.visible ? (
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
        ) : null}
        {shouldRenderFields ? (
          <dl className={styles.details}>
            {dropdown ? (
              <div className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>
                  <label htmlFor={dropdown.selectId}>{dropdown.label}</label>
                </dt>
                <dd className={styles["detail-value"]}>
                  <div
                    className={styles["field-shell"]}
                    data-interactive="menu"
                    data-has-arrow="true"
                  >
                    <SelectMenu
                      id={dropdown.selectId}
                      options={dropdown.options}
                      value={dropdown.value}
                      onChange={dropdown.onSelect}
                      ariaLabel={dropdown.label}
                      fullWidth
                    />
                  </div>
                </dd>
                <div className={styles["detail-action"]} aria-live="polite">
                  {dropdown.isSaving ? (
                    <span className={styles.placeholder}>{savingLabel}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {fields.map((field) => (
              <div key={field.inputId} className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>
                  <label htmlFor={field.inputId}>{field.label}</label>
                </dt>
                <dd className={styles["detail-value"]}>
                  <div
                    className={styles["field-shell"]}
                    data-interactive={field.multiline ? "textarea" : "input"}
                  >
                    {field.multiline ? (
                      <textarea
                        id={field.inputId}
                        className={composeClassName(
                          styles["field-control"],
                          styles["field-control-textarea"],
                        )}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder={field.placeholder}
                        rows={field.rows ?? 3}
                      />
                    ) : (
                      <input
                        id={field.inputId}
                        type="text"
                        className={composeClassName(
                          styles["field-control"],
                          styles["field-control-input"],
                        )}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                </dd>
                <div className={styles["detail-action"]} aria-live="polite">
                  {field.isSaving ? (
                    <span className={styles.placeholder}>{savingLabel}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </dl>
        ) : null}
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
