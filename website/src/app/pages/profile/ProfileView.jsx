import { memo } from "react";
import "@app/pages/App/App.css";
import Avatar from "@shared/components/ui/Avatar";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import EditableField from "@shared/components/form/EditableField/EditableField.jsx";
import FormField from "@shared/components/form/FormField.jsx";
import ThemeIcon from "@shared/components/ui/Icon";
import Tooltip from "@shared/components/ui/Tooltip";
import EmailBindingCard from "@shared/components/Profile/EmailBindingCard";
import UsernameEditor from "@shared/components/Profile/UsernameEditor";
import CustomSectionsEditor from "@shared/components/Profile/CustomSectionsEditor";
import AvatarEditorModal from "@shared/components/AvatarEditorModal";
import styles from "./Profile.module.css";
import {
  profileFormPropTypes,
  profileFormDefaultProps,
  avatarEditorPropTypes,
  profilePageLayoutPropTypes,
  profilePageLayoutDefaultProps,
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

const buildFormProps = (viewProps) => ({
  t: viewProps.t,
  avatarController: viewProps.avatarController,
  currentUser: viewProps.currentUser,
  usernameHandlers: viewProps.usernameHandlers,
  emailBinding: viewProps.emailBinding,
  emailWorkflow: viewProps.emailWorkflow,
  phoneState: viewProps.phoneState,
  detailsState: viewProps.detailsState,
  isSaving: viewProps.isSaving,
  onCancel: viewProps.onCancel,
  handleSave: viewProps.handleSave,
});

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

const buildFormContext = (formProps) => {
  const contactProps = buildContactProps({
    emailBinding: formProps.emailBinding,
    emailWorkflow: formProps.emailWorkflow,
    currentUser: formProps.currentUser,
    phoneState: formProps.phoneState,
    t: formProps.t,
  });
  const fieldsProps = buildFieldsProps({
    detailsState: formProps.detailsState,
    t: formProps.t,
  });
  const actionsProps = {
    isSaving: formProps.isSaving,
    onCancel: formProps.onCancel,
    t: formProps.t,
  };
  return {
    avatar: formProps.avatarController.avatar,
    onAvatarChange: formProps.avatarController.handleAvatarChange,
    avatarHint: formProps.t.avatarHint,
    username: formProps.currentUser?.username,
    onSubmitUsername: formProps.usernameHandlers.onSubmit,
    onFailUsername: formProps.usernameHandlers.onFailure,
    contactProps,
    fieldsProps,
    actionsProps,
    t: formProps.t,
  };
};

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

const ProfileForm = memo(function ProfileForm(props) {
  const { handleSave } = props;
  const context = buildFormContext(props);
  const formSections = FORM_SECTION_BUILDERS.map((builder) => builder(context));
  return (
    <form onSubmit={handleSave} className={styles["profile-card"]}>
      {formSections}
    </form>
  );
});

const AvatarEditor = memo(function AvatarEditor({ controller }) {
  return (
    <AvatarEditorModal
      open={controller.editor.phase !== "idle"}
      source={controller.editor.source}
      onCancel={controller.handleAvatarModalClose}
      onConfirm={controller.handleAvatarConfirm}
      labels={controller.labels}
      isProcessing={controller.editor.phase === "uploading"}
    />
  );
});

const ProfilePageLayout = memo(function ProfilePageLayout({ title, popup, children }) {
  return (
    <div className="app">
      <h2>{title}</h2>
      {children}
      <FeedbackHub popup={popup} />
    </div>
  );
});

function ProfileView(props) {
  const { t, avatarController, popup } = props;
  const formProps = buildFormProps(props);
  return (
    <ProfilePageLayout title={t.profileTitle} popup={popup.popupConfig}>
      <ProfileForm {...formProps} />
      <AvatarEditor controller={avatarController} />
    </ProfilePageLayout>
  );
}

ProfileForm.propTypes = profileFormPropTypes;
ProfileForm.defaultProps = profileFormDefaultProps;

AvatarEditor.propTypes = avatarEditorPropTypes;

ProfilePageLayout.propTypes = profilePageLayoutPropTypes;
ProfilePageLayout.defaultProps = profilePageLayoutDefaultProps;

ProfileView.propTypes = profileViewPropTypes;
ProfileView.defaultProps = profileViewDefaultProps;

export default ProfileView;
