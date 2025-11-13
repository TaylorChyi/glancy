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

const SECTION_CLASSES = {
  section: composeClassName(styles.section, styles["section-plain"]),
  header: styles["section-header"],
  title: styles["section-title"],
  divider: styles["section-divider"],
  description: styles["visually-hidden"],
};

const FieldModelPropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["history", "retention", "language", "actions"])
    .isRequired,
  props: PropTypes.object.isRequired,
});

const SectionLayout = ({ section, children }) => (
  <SettingsSection
    headingId={section.headingId}
    title={section.title}
    description={section.description}
    descriptionId={section.descriptionId}
    classes={SECTION_CLASSES}
  >
    {children}
  </SettingsSection>
);

SectionLayout.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    descriptionId: PropTypes.string,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

const renderField = ({ key, type, props }) => {
  const FieldComponent = FIELD_COMPONENTS[type];
  if (!FieldComponent) {
    return null;
  }
  return <FieldComponent key={key} styles={styles} {...props} />;
};

const FieldList = ({ fields }) => (
  <div className={styles.controls}>{fields.map(renderField)}</div>
);

FieldList.propTypes = {
  fields: PropTypes.arrayOf(FieldModelPropType).isRequired,
};

function DataSectionView({ section, fields }) {
  return (
    <SectionLayout section={section}>
      <FieldList fields={fields} />
    </SectionLayout>
  );
}

DataSectionView.propTypes = {
  section: SectionLayout.propTypes.section,
  fields: FieldList.propTypes.fields,
};

export default DataSectionView;
