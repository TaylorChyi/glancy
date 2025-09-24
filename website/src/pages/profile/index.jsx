import { useState, useEffect } from "react";
import "@/pages/App/App.css";
import styles from "./Profile.module.css";
import Avatar from "@/components/ui/Avatar";
import { useLanguage } from "@/context";
import MessagePopup from "@/components/ui/MessagePopup";
import AgeStepper from "@/components/form/AgeStepper/AgeStepper.jsx";
import GenderSelect from "@/components/form/GenderSelect/GenderSelect.jsx";
import EditableField from "@/components/form/EditableField/EditableField.jsx";
import FormField from "@/components/form/FormField.jsx";
import { useApi, useEmailBinding } from "@/hooks";
import { useUser } from "@/context";
import { cacheBust } from "@/utils";
import ThemeIcon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import EmailBindingCard from "@/components/Profile/EmailBindingCard";

function Profile({ onCancel }) {
  const { t } = useLanguage();
  const { user: currentUser, setUser } = useUser();
  const api = useApi();
  const [username, setUsername] = useState(currentUser?.username || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interests, setInterests] = useState("");
  const [goal, setGoal] = useState("");
  const [avatar, setAvatar] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUsername(currentUser?.username || "");
    setPhone(currentUser?.phone || "");
  }, [currentUser]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const preview = URL.createObjectURL(file);
    setAvatar(preview);
    try {
      const data = await api.users.uploadAvatar({
        userId: currentUser.id,
        file,
        token: currentUser.token,
      });
      const url = cacheBust(data.avatar);
      setAvatar(url);
      setUser({ ...currentUser, avatar: url });
    } catch (err) {
      console.error(err);
      setPopupMsg(t.fail);
      setPopupOpen(true);
    } finally {
      URL.revokeObjectURL(preview);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    api.profiles
      .fetchProfile({ token: currentUser.token })
      .then((data) => {
        setAge(data.age);
        setGender(data.gender);
        setInterests(data.interest);
        setGoal(data.goal);
        if (data.avatar) {
          const url = cacheBust(data.avatar);
          setAvatar(url);
        }
      })
      .catch((err) => {
        console.error(err);
        setPopupMsg(t.fail);
        setPopupOpen(true);
      });
  }, [api, t, currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    const nextUser = { ...currentUser };
    let hasIdentityUpdates = false;

    try {
      const updatePromises = [];

      if (username && username !== currentUser.username) {
        updatePromises.push(
          api.users
            .updateUsername({
              userId: currentUser.id,
              username,
              token: currentUser.token,
            })
            .then(({ username: updatedUsername }) => {
              nextUser.username = updatedUsername;
              hasIdentityUpdates = true;
            }),
        );
      }

      if (phone !== currentUser.phone) {
        updatePromises.push(
          api.users
            .updateContact({
              userId: currentUser.id,
              email: currentUser.email,
              phone,
              token: currentUser.token,
            })
            .then(({ phone: updatedPhone }) => {
              nextUser.phone = updatedPhone;
              hasIdentityUpdates = true;
            }),
        );
      }

      updatePromises.push(
        api.profiles.saveProfile({
          token: currentUser.token,
          profile: {
            age,
            gender,
            job: "",
            interest: interests,
            goal,
          },
        }),
      );

      await Promise.all(updatePromises);

      if (hasIdentityUpdates) {
        setUser(nextUser);
      }

      setPopupMsg(t.updateSuccess);
      setPopupOpen(true);
    } catch (err) {
      console.error(err);
      setPopupMsg(t.fail);
      setPopupOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const emailBinding = useEmailBinding({
    user: currentUser,
    onUserUpdate: setUser,
  });

  const resolveEmailErrorMessage = (error) => {
    if (!error) return t.fail;
    if (error.code === "email-binding-email-required") {
      return t.emailInputRequired;
    }
    if (error.code === "email-binding-email-unchanged") {
      return t.emailSameAsCurrent;
    }
    if (error.code === "email-binding-code-required") {
      return t.emailCodeRequired;
    }
    if (error.code === "email-binding-code-missing-request") {
      return t.emailCodeNotRequested;
    }
    if (error.code === "email-binding-email-mismatch") {
      return t.emailCodeMismatch;
    }
    if (error.message) {
      return error.message;
    }
    return t.fail;
  };

  const handleEmailCodeRequest = async (nextEmail) => {
    if (!nextEmail) {
      setPopupMsg(t.emailInputRequired);
      setPopupOpen(true);
      return false;
    }

    try {
      await emailBinding.requestCode(nextEmail);
      setPopupMsg(t.emailCodeSent);
      setPopupOpen(true);
      return true;
    } catch (error) {
      console.error(error);
      setPopupMsg(resolveEmailErrorMessage(error));
      setPopupOpen(true);
      return false;
    }
  };

  const handleEmailConfirm = async ({ email: nextEmail, code }) => {
    try {
      await emailBinding.confirmChange({ email: nextEmail, code });
      setPopupMsg(t.emailChangeSuccess);
      setPopupOpen(true);
    } catch (error) {
      console.error(error);
      setPopupMsg(resolveEmailErrorMessage(error));
      setPopupOpen(true);
    }
  };

  const handleEmailUnbind = async () => {
    try {
      await emailBinding.unbindEmail();
      setPopupMsg(t.emailUnbindSuccess);
      setPopupOpen(true);
    } catch (error) {
      console.error(error);
      setPopupMsg(resolveEmailErrorMessage(error));
      setPopupOpen(true);
    }
  };

  return (
    <div className="app">
      <h2>{t.profileTitle}</h2>
      <form onSubmit={handleSave} className={styles["profile-card"]}>
        <div className={styles["avatar-area"]}>
          {avatar && typeof avatar === "string" ? (
            <img src={avatar} alt="avatar" />
          ) : (
            <Avatar
              width={100}
              height={100}
              style={{ borderRadius: "var(--radius-xl)" }}
            />
          )}
          <span className={styles["avatar-hint"]}>{t.avatarHint}</span>
          <input
            type="file"
            onChange={handleAvatarChange}
            style={{ position: "absolute", inset: 0, opacity: 0 }}
          />
        </div>
        <EditableField
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t.usernamePlaceholder}
          inputClassName={styles["username-input"]}
          buttonText={t.editButton}
        />
        <EmailBindingCard
          email={currentUser?.email ?? ""}
          mode={emailBinding.mode}
          isSendingCode={emailBinding.isSendingCode}
          isVerifying={emailBinding.isVerifying}
          isUnbinding={emailBinding.isUnbinding}
          isAwaitingVerification={emailBinding.isAwaitingVerification}
          requestedEmail={emailBinding.requestedEmail}
          onStart={emailBinding.startEditing}
          onCancel={emailBinding.cancelEditing}
          onRequestCode={handleEmailCodeRequest}
          onConfirm={handleEmailConfirm}
          onUnbind={handleEmailUnbind}
          t={t}
        />
        <EditableField
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.phonePlaceholder}
          inputClassName={styles["phone-input"]}
          buttonText={t.editButton}
        />
        <div className={styles.basic}>
          <FormField
            label={
              <>
                <ThemeIcon
                  name="cake"
                  className={styles.icon}
                  width={20}
                  height={20}
                />
                {t.ageLabel}
                <Tooltip text={t.ageHelp}>?</Tooltip>
              </>
            }
            id="profile-age"
          >
            <AgeStepper value={age} onChange={setAge} />
          </FormField>
          <FormField
            label={
              <>
                <ThemeIcon
                  name="user"
                  className={styles.icon}
                  width={20}
                  height={20}
                />
                {t.genderLabel}
                <Tooltip text={t.genderHelp}>?</Tooltip>
              </>
            }
            id="profile-gender"
          >
            <GenderSelect value={gender} onChange={setGender} />
          </FormField>
          <FormField
            label={
              <>
                <ThemeIcon
                  name="star-outline"
                  className={styles.icon}
                  width={20}
                  height={20}
                />
                {t.interestsLabel}
                <Tooltip text={t.interestsHelp}>?</Tooltip>
              </>
            }
            id="profile-interests"
          >
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={t.interestsPlaceholder}
            />
          </FormField>
          <FormField
            label={
              <>
                <ThemeIcon
                  name="target"
                  className={styles.icon}
                  width={20}
                  height={20}
                />
                {t.goalLabel}
                <Tooltip text={t.goalHelp}>?</Tooltip>
              </>
            }
            id="profile-goal"
          >
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t.goalPlaceholder}
            />
          </FormField>
        </div>
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles["save-btn"]}
            disabled={isSaving}
          >
            {t.saveButton}
          </button>
          <button
            type="button"
            className={styles["cancel-btn"]}
            onClick={onCancel}
          >
            {t.cancelButton}
          </button>
        </div>
      </form>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}

export default Profile;
