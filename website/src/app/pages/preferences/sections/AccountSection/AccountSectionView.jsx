import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import AccountIdentityRow from "../AccountIdentityRow.jsx";
import AccountFieldList from "../AccountFieldList.jsx";
import AccountBindings from "../AccountBindings.jsx";
import styles from "../../Preferences.module.css";

function AccountSectionView({ section, identity, fields, bindings }) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      classes={{
        section: `${styles.section} ${styles["section-plain"]}`,
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <dl className={styles.details}>
        <AccountIdentityRow
          identity={identity}
          avatarSize={identity.avatarSize}
          avatarInputId={identity.avatarInputId}
          avatarInputRef={identity.avatarInputRef}
          onAvatarTrigger={identity.onAvatarTrigger}
          onAvatarChange={identity.onAvatarChange}
        />
        <AccountFieldList fields={fields} headingId={section.headingId} />
      </dl>
      <AccountBindings bindings={bindings} />
    </SettingsSection>
  );
}

AccountSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  identity: PropTypes.shape({
    label: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    changeLabel: PropTypes.string.isRequired,
    avatarAlt: PropTypes.string,
    avatarSize: PropTypes.number.isRequired,
    avatarInputId: PropTypes.string.isRequired,
    avatarInputRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
    onAvatarTrigger: PropTypes.func,
    onAvatarChange: PropTypes.func,
    isUploading: PropTypes.bool,
  }).isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      renderValue: PropTypes.func,
      type: PropTypes.string,
      readOnlyInputProps: PropTypes.shape({
        type: PropTypes.string,
        inputMode: PropTypes.string,
        autoComplete: PropTypes.string,
        name: PropTypes.string,
        placeholder: PropTypes.string,
      }),
      usernameEditorProps: PropTypes.shape({
        username: PropTypes.string,
        emptyDisplayValue: PropTypes.string,
        onSubmit: PropTypes.func,
        onSuccess: PropTypes.func,
        onFailure: PropTypes.func,
        t: PropTypes.func,
        inputClassName: PropTypes.string,
      }),
      action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        onClick: PropTypes.func,
        isPending: PropTypes.bool,
        pendingLabel: PropTypes.string,
      }),
    }),
  ).isRequired,
  bindings: PropTypes.shape({
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        actionLabel: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
};

export default AccountSectionView;
