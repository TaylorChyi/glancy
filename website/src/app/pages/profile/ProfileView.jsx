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

function AvatarUpload({ avatar, onChange, hint }) {
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
}

function UsernameSection({ username, onSubmit, onFailure, t }) {
  return (
    <UsernameEditor
      username={username ?? ""}
      inputClassName={styles["username-input"]}
      onSubmit={onSubmit}
      onFailure={onFailure}
      t={t}
    />
  );
}

function EmailSection({ emailBinding, emailWorkflow, t }) {
  return (
    <EmailBindingCard
      email={emailBinding?.email ?? ""}
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
}

function PhoneField({ phone, onChange, t }) {
  return (
    <EditableField
      value={phone}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t.phonePlaceholder}
      inputClassName={styles["phone-input"]}
      buttonText={t.editButton}
    />
  );
}

function FieldGroups({ fieldGroups, details, onFieldChange }) {
  return fieldGroups.map((group) => (
    <div className={styles.basic} key={group.key}>
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
  ));
}

function Actions({ isSaving, onCancel, t }) {
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
}

function ProfileForm({
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
  handleSave,
}) {
  return (
    <form onSubmit={handleSave} className={styles["profile-card"]}>
      <AvatarUpload
        avatar={avatarController.avatar}
        onChange={avatarController.handleAvatarChange}
        hint={t.avatarHint}
      />
      <UsernameSection
        username={currentUser?.username}
        onSubmit={usernameHandlers.onSubmit}
        onFailure={usernameHandlers.onFailure}
        t={t}
      />
      <EmailSection
        emailBinding={{ ...emailBinding, email: currentUser?.email ?? "" }}
        emailWorkflow={emailWorkflow}
        t={t}
      />
      <PhoneField
        phone={phoneState.phone}
        onChange={phoneState.setPhone}
        t={t}
      />
      <FieldGroups
        fieldGroups={detailsState.fieldGroups}
        details={detailsState.details}
        onFieldChange={detailsState.handleFieldChange}
      />
      <CustomSectionsEditor
        sections={detailsState.details.customSections}
        onChange={detailsState.handleCustomSectionsChange}
        t={t}
        styles={styles}
      />
      <Actions isSaving={isSaving} onCancel={onCancel} t={t} />
    </form>
  );
}

function ProfileView({
  t,
  avatarController,
  emailBinding,
  emailWorkflow,
  phoneState,
  detailsState,
  isSaving,
  handleSave,
  onCancel,
  popup,
  currentUser,
  usernameHandlers,
}) {
  return (
    <div className="app">
      <h2>{t.profileTitle}</h2>
      <ProfileForm
        t={t}
        avatarController={avatarController}
        currentUser={currentUser}
        usernameHandlers={usernameHandlers}
        emailBinding={emailBinding}
        emailWorkflow={emailWorkflow}
        phoneState={phoneState}
        detailsState={detailsState}
        isSaving={isSaving}
        onCancel={onCancel}
        handleSave={handleSave}
      />
      <AvatarEditorModal
        open={avatarController.editor.phase !== "idle"}
        source={avatarController.editor.source}
        onCancel={avatarController.handleAvatarModalClose}
        onConfirm={avatarController.handleAvatarConfirm}
        labels={avatarController.labels}
        isProcessing={avatarController.editor.phase === "uploading"}
      />
      <FeedbackHub popup={popup.popupConfig} />
    </div>
  );
}

export default ProfileView;
