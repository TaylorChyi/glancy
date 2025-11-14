import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import {
  DataActionsField,
  HistoryCaptureField,
  LanguageHistoryField,
  RetentionField,
} from "../DataSectionFields.jsx";
import styles from "../../Preferences.module.css";

const FIELD_COMPONENTS = {
  history: HistoryCaptureField,
  retention: RetentionField,
  language: LanguageHistoryField,
  actions: DataActionsField,
};

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const sectionPropType = PropTypes.shape({
  headingId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  descriptionId: PropTypes.string,
});

const fieldPropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["history", "retention", "language", "actions"]) 
    .isRequired,
  props: PropTypes.object.isRequired,
});

const fieldsPropType = PropTypes.arrayOf(fieldPropType);

const SectionLayout = ({ section, children }) => (
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
      description: styles["visually-hidden"],
    }}
  >
    {children}
  </SettingsSection>
);

SectionLayout.propTypes = {
  section: sectionPropType.isRequired,
  children: PropTypes.node.isRequired,
};

const renderField = ({ key, type, props }) => {
  const FieldComponent = FIELD_COMPONENTS[type];
  if (!FieldComponent) {
    return null;
  }
  return <FieldComponent key={key} styles={styles} {...props} />;
};

const FieldsList = ({ fields }) => (
  <div className={styles.controls}>{fields.map(renderField)}</div>
);

FieldsList.propTypes = {
  fields: fieldsPropType.isRequired,
};

function DataSectionView({ section, fields }) {
  return (
    <SectionLayout section={section}>
      <FieldsList fields={fields} />
    </SectionLayout>
  );
}

DataSectionView.propTypes = {
  section: sectionPropType.isRequired,
  fields: fieldsPropType.isRequired,
};

export default DataSectionView;
