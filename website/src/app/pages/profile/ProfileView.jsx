import { memo } from "react";
import "@app/pages/App/App.css";
import Avatar from "@shared/components/ui/Avatar";
import EditableField from "@shared/components/form/EditableField/EditableField.jsx";
import FormField from "@shared/components/form/FormField.jsx";
import ThemeIcon from "@shared/components/ui/Icon";
import Tooltip from "@shared/components/ui/Tooltip";
import EmailBindingCard from "@shared/components/Profile/EmailBindingCard";
import UsernameEditor from "@shared/components/Profile/UsernameEditor";
import CustomSectionsEditor from "@shared/components/Profile/CustomSectionsEditor";
import styles from "./Profile.module.css";
import ProfileAvatarEditor from "./ProfileAvatarEditor.jsx";
import ProfileLayout from "./ProfileLayout.jsx";
import { useProfileViewComposition } from "./useProfileViewComposition.js";
import {
  profileFormPropTypes,
  profileFormDefaultProps,
  profileViewPropTypes,
  profileViewDefaultProps,
} from "./ProfileView.propTypes.js";

const AvatarSection = memo(function AvatarSection({ avatar, onChange, hint }) {
  return (
    <div className={styles["avatar-area"]}>
      <Avatar
        src={typeof avatar === "string" && avatar ? avatar : undefined}
        className={styles["profile-avatar"]}
        elevation="none"
      />
      <span className={styles["avatar-hint"]}>{hint}</span>
      <input
        type="file"
        onChange={onChange}
        style={{ position: "absolute", inset: 0, opacity: 0 }}
      />
    </div>
  );
});

const IdentitySection = memo(function IdentitySection({ username, onSubmit, onFailure, t }) {
  return (
    <UsernameEditor
      username={username ?? ""}
      inputClassName={styles["username-input"]}
      onSubmit={onSubmit}
      onFailure={onFailure}
      t={t}
    />
  );
});

const EmailBindingSection = memo(function EmailBindingSection({
  emailBinding,
  emailWorkflow,
  currentEmail,
  t,
}) {
  return (
    <EmailBindingCard
      email={currentEmail ?? ""}
      mode={emailBinding.mode}
      isSendingCode={emailBinding.isSendingCode}
      isVerifying={emailBinding.isVerifying}
      isUnbinding={emailBinding.isUnbinding}
      isAwaitingVerification={emailBinding.isAwaitingVerification}
      requestedEmail={emailBinding.requestedEmail}
      onStart={emailBinding.startEditing}
      onCancel={emailBinding.cancelEditing}
      onRequestCode={emailWorkflow.requestCode}
      onConfirm={emailWorkflow.confirmChange}
      onUnbind={emailWorkflow.unbind}
      t={t}
    />
  );
});

const PhoneSection = memo(function PhoneSection({ phone, onPhoneChange, t }) {
  return (
    <EditableField
      value={phone}
      onChange={(event) => onPhoneChange(event.target.value)}
      placeholder={t.phonePlaceholder}
      inputClassName={styles["phone-input"]}
      buttonText={t.editButton}
    />
  );
});

const ContactSection = memo(function ContactSection(props) {
  const { emailBinding, emailWorkflow, currentEmail, phone, onPhoneChange, t } = props;
  return (
    <>
      <EmailBindingSection
        emailBinding={emailBinding}
        emailWorkflow={emailWorkflow}
        currentEmail={currentEmail}
        t={t}
      />
      <PhoneSection phone={phone} onPhoneChange={onPhoneChange} t={t} />
    </>
  );
});

const ProfileFieldGroup = memo(function ProfileFieldGroup({ group, details, onFieldChange }) {
  return (
    <div className={styles.basic}>
      {group.fields.map((field) => (
        <FormField
          key={field.key}
          label={
            <>
              <ThemeIcon
                name={field.icon}
                className={styles.icon}
                width={20}
                height={20}
              />
              {field.label}
              {field.help ? <Tooltip text={field.help}>?</Tooltip> : null}
            </>
          }
          id={`profile-${field.key}`}
        >
          <input
            value={details[field.key] ?? ""}
            onChange={onFieldChange(field.key)}
            placeholder={field.placeholder}
          />
        </FormField>
      ))}
    </div>
  );
});

const ActionsSection = memo(function ActionsSection({ isSaving, onCancel, t }) {
  return (
    <div className={styles.actions}>
      <button type="submit" className={styles["save-btn"]} disabled={isSaving}>
        {t.saveButton}
      </button>
      <button type="button" className={styles["cancel-btn"]} onClick={onCancel}>
        {t.cancelButton}
      </button>
    </div>
  );
});

const FieldsSection = memo(function FieldsSection({
  fieldGroups,
  details,
  customSections,
  onFieldChange,
  onCustomSectionsChange,
  t,
}) {
  return (
    <>
      {fieldGroups.map((group) => (
        <ProfileFieldGroup
          key={group.key}
          group={group}
          details={details}
          onFieldChange={onFieldChange}
        />
      ))}
      <CustomSectionsEditor
        sections={customSections ?? []}
        onChange={onCustomSectionsChange}
        t={t}
        styles={styles}
      />
    </>
  );
});

const buildContactProps = ({ emailBinding, emailWorkflow, currentUser, phoneState, t }) => ({
  emailBinding,
  emailWorkflow,
  currentEmail: currentUser?.email,
  phone: phoneState.phone,
  onPhoneChange: phoneState.setPhone,
  t,
});

const buildFieldsProps = ({ detailsState, t }) => {
  const {
    fieldGroups,
    details,
    handleFieldChange,
    handleCustomSectionsChange,
  } = detailsState;
  return {
    fieldGroups,
    details,
    customSections: details.customSections,
    onFieldChange: handleFieldChange,
    onCustomSectionsChange: handleCustomSectionsChange,
    t,
  };
};

const buildActionsProps = ({ isSaving, onCancel, t }) => ({ isSaving, onCancel, t });

const FORM_SECTION_BUILDERS = [
  (context) => (
    <AvatarSection
      key="avatar"
      avatar={context.avatar}
      onChange={context.onAvatarChange}
      hint={context.avatarHint}
    />
  ),
  (context) => (
    <IdentitySection
      key="identity"
      username={context.username}
      onSubmit={context.onSubmitUsername}
      onFailure={context.onFailUsername}
      t={context.t}
    />
  ),
  (context) => <ContactSection key="contact" {...context.contactProps} />,
  (context) => <FieldsSection key="fields" {...context.fieldsProps} />,
  (context) => <ActionsSection key="actions" {...context.actionsProps} />,
];

const getProfileFormSections = (formProps) => {
  const context = buildFormContext(formProps);
  return FORM_SECTION_BUILDERS.map((builder) => builder(context));
};

const buildFormContext = ({
  t,
  avatarController,
  currentUser,
  usernameHandlers,
  emailBinding,
  emailWorkflow,
  phoneState,
  detailsState,
  isSaving,
  onCancel,
}) => {
  const contactProps = buildContactProps({ emailBinding, emailWorkflow, currentUser, phoneState, t });
  const fieldsProps = buildFieldsProps({ detailsState, t });
  const actionsProps = buildActionsProps({ isSaving, onCancel, t });

  return {
    avatar: avatarController.avatar,
    onAvatarChange: avatarController.handleAvatarChange,
    avatarHint: t.avatarHint,
    username: currentUser?.username,
    onSubmitUsername: usernameHandlers.onSubmit,
    onFailUsername: usernameHandlers.onFailure,
    contactProps,
    fieldsProps,
    actionsProps,
    t,
  };
};

const ProfileForm = memo(function ProfileForm(props) {
  const { handleSave } = props;
  const formSections = getProfileFormSections(props);
  return (
    <form onSubmit={handleSave} className={styles["profile-card"]}>
      {formSections}
    </form>
  );
});

function ProfileView(props) {
  const { formProps, layoutProps, avatarEditorProps } = useProfileViewComposition(props);
  return (
    <ProfileLayout {...layoutProps}>
      <ProfileForm {...formProps} />
      <ProfileAvatarEditor {...avatarEditorProps} />
    </ProfileLayout>
  );
}

ProfileForm.propTypes = profileFormPropTypes;
ProfileForm.defaultProps = profileFormDefaultProps;

ProfileView.propTypes = profileViewPropTypes;
ProfileView.defaultProps = profileViewDefaultProps;

export default ProfileView;
