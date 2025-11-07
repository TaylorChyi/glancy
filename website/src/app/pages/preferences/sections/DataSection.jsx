import PropTypes from "prop-types";
import { createElement } from "react";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../Preferences.module.css";
import {
  DataActionsField,
  HistoryCaptureField,
  LanguageHistoryField,
  RetentionField,
} from "./DataSectionFields.jsx";
import { useDataSectionController } from "./useDataSectionController.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const buildFieldDefinitions = ({
  ids,
  copy,
  historyToggle,
  retentionControl,
  languageControl,
  actionsControl,
  isActionPending,
}) => [
  {
    key: "history",
    Component: HistoryCaptureField,
    props: { fieldId: ids.toggle, copy: copy.toggle, control: historyToggle },
  },
  {
    key: "retention",
    Component: RetentionField,
    props: {
      fieldId: ids.retention,
      copy: copy.retention,
      control: retentionControl,
      isPending: isActionPending(retentionControl.pendingId),
    },
  },
  {
    key: "language",
    Component: LanguageHistoryField,
    props: {
      fieldId: ids.language,
      copy: languageControl.copy,
      control: languageControl,
      isPending: isActionPending(languageControl.pendingId),
    },
  },
  {
    key: "actions",
    Component: DataActionsField,
    props: {
      copy: actionsControl.copy,
      control: actionsControl,
      isClearingAll: isActionPending(actionsControl.pendingId),
    },
  },
];

function DataSection({ title, message, headingId, descriptionId }) {
  const {
    copy,
    ids,
    description,
    historyToggle,
    retentionControl,
    languageControl,
    actionsControl,
    isActionPending,
  } = useDataSectionController({ message, descriptionId });

  const fieldDefinitions = buildFieldDefinitions({
    ids,
    copy,
    historyToggle,
    retentionControl,
    languageControl,
    actionsControl,
    isActionPending,
  });

  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      description={description.section}
      descriptionId={description.id}
      classes={{
        section: composeClassName(styles.section, styles["section-plain"]),
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
        description: styles["visually-hidden"],
      }}
    >
      <div className={styles.controls}>
        {fieldDefinitions.map(({ key, Component, props }) =>
          createElement(Component, { key, styles, ...props }),
        )}
      </div>
    </SettingsSection>
  );
}

DataSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
};

DataSection.defaultProps = {
  message: "",
  descriptionId: undefined,
};

export default DataSection;
