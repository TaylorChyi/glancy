/**
 * 背景：
 *  - Profile 页面此前承载年龄、性别等字段，且缺乏集中注释，难以追踪身份字段的演进历史。
 * 目的：
 *  - 只保留可编辑的身份核心信息与联系渠道，确保前端状态与后端字段一致。
 * 关键决策与取舍：
 *  - 继续复用 `EditableField` 等表单元件，避免一次性补丁；
 *  - 移除年龄/性别后保留兴趣与目标字段，与新的画像结构对齐。
 * 影响范围：
 *  - 账户管理模态与偏好设置读取的身份字段，确保无遗留输入控件。
 * 演进与TODO：
 *  - TODO: 后续若支持更多画像字段，应通过配置驱动扩展而非硬编码。
 */
import {
  useState,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";
import "@/pages/App/App.css";
import styles from "./Profile.module.css";
import Avatar from "@/components/ui/Avatar";
import { useLanguage } from "@/context";
import MessagePopup from "@/components/ui/MessagePopup";
import EditableField from "@/components/form/EditableField/EditableField.jsx";
import FormField from "@/components/form/FormField.jsx";
import { useEmailBinding } from "@/hooks";
import { useApi } from "@/hooks/useApi.js";
import { useUser } from "@/context";
import { cacheBust } from "@/utils";
import ThemeIcon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import EmailBindingCard from "@/components/Profile/EmailBindingCard";
import UsernameEditor from "@/components/Profile/UsernameEditor";
import CustomSectionsEditor from "@/components/Profile/CustomSectionsEditor";
import AvatarEditorModal from "@/components/AvatarEditorModal";
import { normalizeAvatarFileName } from "@/utils/avatarFile.js";
import {
  createEmptyProfileDetails,
  mapProfileDetailsToRequest,
  mapResponseToProfileDetails,
  profileDetailsReducer,
} from "./profileDetailsModel.js";

const avatarEditorInitialState = Object.freeze({
  phase: "idle",
  source: "",
  fileName: "avatar.png",
  fileType: "image/png",
});

function createAvatarEditorInitialState() {
  return { ...avatarEditorInitialState };
}

/**
 * 意图：通过轻量状态机管理头像编辑流程，保障模态在打开/上传/失败间的状态一致性。
 * 输入：当前状态与动作对象。
 * 输出：返回下一个状态。
 * 流程：
 *  1) open -> 进入预览；
 *  2) startUpload -> 标记上传中；
 *  3) fail -> 回退至预览；
 *  4) complete/close -> 回归空闲。
 * 错误处理：未知动作回退为当前状态。
 * 复杂度：O(1)。
 */
function avatarEditorReducer(state = avatarEditorInitialState, action) {
  switch (action.type) {
    case "open": {
      return {
        phase: "preview",
        source: action.payload?.source ?? "",
        fileName: action.payload?.fileName || "avatar.png",
        fileType: action.payload?.fileType || "image/png",
      };
    }
    case "startUpload":
      return { ...state, phase: "uploading" };
    case "fail":
      return { ...state, phase: "preview" };
    case "complete":
    case "close":
      return createAvatarEditorInitialState();
    default:
      return state;
  }
}

function Profile({ onCancel }) {
  const { t } = useLanguage();
  const { user: currentUser, setUser } = useUser();
  const api = useApi();
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [details, dispatchDetails] = useReducer(
    profileDetailsReducer,
    undefined,
    createEmptyProfileDetails,
  );
  const [persistedMeta, setPersistedMeta] = useState({
    dailyWordTarget: null,
    futurePlan: null,
  });
  const [avatar, setAvatar] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const previousAvatarRef = useRef("");

  const [avatarEditor, dispatchAvatarEditor] = useReducer(
    avatarEditorReducer,
    undefined,
    createAvatarEditorInitialState,
  );

  useEffect(() => {
    return () => {
      if (avatarEditor.source) {
        URL.revokeObjectURL(avatarEditor.source);
      }
    };
  }, [avatarEditor.source]);

  const fieldGroups = useMemo(
    () => [
      {
        key: "background",
        fields: [
          {
            key: "education",
            icon: "library",
            label: t.educationLabel,
            placeholder: t.educationPlaceholder,
            help: t.educationHelp,
          },
          {
            key: "job",
            icon: "command-line",
            label: t.jobLabel,
            placeholder: t.jobPlaceholder,
            help: t.jobHelp,
          },
        ],
      },
      {
        key: "growth",
        fields: [
          {
            key: "interests",
            icon: "star-outline",
            label: t.interestsLabel,
            placeholder: t.interestsPlaceholder,
            help: t.interestsHelp,
          },
          {
            key: "goal",
            icon: "flag",
            label: t.goalLabel,
            placeholder: t.goalPlaceholder,
            help: t.goalHelp,
          },
          {
            key: "currentAbility",
            icon: "shield-check",
            label: t.currentAbilityLabel,
            placeholder: t.currentAbilityPlaceholder,
            help: t.currentAbilityHelp,
          },
        ],
      },
    ],
    [t],
  );

  const handleFieldChange = useCallback(
    (field) => (event) => {
      dispatchDetails({
        type: "updateField",
        field,
        value: event.target.value,
      });
    },
    [dispatchDetails],
  );

  const handleCustomSectionsChange = useCallback(
    (sections) => {
      dispatchDetails({ type: "setCustomSections", sections });
    },
    [dispatchDetails],
  );

  useEffect(() => {
    setPhone(currentUser?.phone || "");
  }, [currentUser]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentUser) {
      return;
    }
    const source = URL.createObjectURL(file);
    dispatchAvatarEditor({
      type: "open",
      payload: {
        source,
        fileName: file.name,
        fileType: file.type,
      },
    });
  };

  const handleAvatarModalClose = useCallback(() => {
    previousAvatarRef.current = "";
    dispatchAvatarEditor({ type: "close" });
  }, []);

  const avatarEditorLabels = useMemo(
    () => ({
      title: t.avatarEditorTitle,
      description: t.avatarEditorDescription,
      zoomIn: t.avatarZoomIn,
      zoomOut: t.avatarZoomOut,
      cancel: t.avatarCancel,
      confirm: t.avatarConfirm,
    }),
    [t],
  );

  const handleAvatarConfirm = useCallback(
    async ({ blob, previewUrl }) => {
      if (!currentUser) {
        URL.revokeObjectURL(previewUrl);
        handleAvatarModalClose();
        return;
      }
      dispatchAvatarEditor({ type: "startUpload" });
      previousAvatarRef.current = avatar;
      setAvatar(previewUrl);
      try {
        const preferredType = blob.type || avatarEditor.fileType || "image/png";
        const normalizedName = normalizeAvatarFileName(
          avatarEditor.fileName,
          preferredType,
        );
        const file = new File([blob], normalizedName, { type: preferredType });
        const data = await api.users.uploadAvatar({
          userId: currentUser.id,
          file,
          token: currentUser.token,
        });
        const url = cacheBust(data.avatar);
        setAvatar(url);
        setUser({ ...currentUser, avatar: url });
        dispatchAvatarEditor({ type: "complete" });
      } catch (error) {
        console.error(error);
        setPopupMsg(t.fail);
        setPopupOpen(true);
        setAvatar(previousAvatarRef.current);
        dispatchAvatarEditor({ type: "fail" });
      } finally {
        previousAvatarRef.current = "";
        URL.revokeObjectURL(previewUrl);
      }
    },
    [
      api,
      avatar,
      avatarEditor.fileName,
      avatarEditor.fileType,
      currentUser,
      handleAvatarModalClose,
      setUser,
      t.fail,
    ],
  );

  useEffect(() => {
    if (!currentUser) return;
    api.profiles
      .fetchProfile({ token: currentUser.token })
      .then((data) => {
        dispatchDetails({
          type: "hydrate",
          payload: mapResponseToProfileDetails(data),
        });
        setPersistedMeta({
          dailyWordTarget: data.dailyWordTarget ?? null,
          futurePlan: data.futurePlan ?? null,
        });
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

      const profilePayload = mapProfileDetailsToRequest(details);
      updatePromises.push(
        api.profiles.saveProfile({
          token: currentUser.token,
          profile: {
            ...profilePayload,
            dailyWordTarget: persistedMeta.dailyWordTarget,
            futurePlan: persistedMeta.futurePlan,
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
          <Avatar
            src={typeof avatar === "string" && avatar ? avatar : undefined}
            className={styles["profile-avatar"]}
            elevation="none"
          />
          <span className={styles["avatar-hint"]}>{t.avatarHint}</span>
          <input
            type="file"
            onChange={handleAvatarChange}
            style={{ position: "absolute", inset: 0, opacity: 0 }}
          />
        </div>
        <UsernameEditor
          username={currentUser?.username ?? ""}
          inputClassName={styles["username-input"]}
          onSubmit={async (nextUsername) => {
            if (!currentUser) {
              throw new Error("User session is unavailable");
            }
            const response = await api.users.updateUsername({
              userId: currentUser.id,
              username: nextUsername,
              token: currentUser.token,
            });
            const updatedUsername = response.username ?? nextUsername;
            const nextUser = { ...currentUser, username: updatedUsername };
            setUser(nextUser);
            setPopupMsg(t.usernameUpdateSuccess);
            setPopupOpen(true);
            return updatedUsername;
          }}
          onFailure={(error) => {
            console.error(error);
          }}
          t={t}
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
        {fieldGroups.map((group) => (
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
                  onChange={handleFieldChange(field.key)}
                  placeholder={field.placeholder}
                />
              </FormField>
            ))}
          </div>
        ))}
        <CustomSectionsEditor
          sections={details.customSections}
          onChange={handleCustomSectionsChange}
          t={t}
          styles={styles}
        />
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
      <AvatarEditorModal
        open={avatarEditor.phase !== "idle"}
        source={avatarEditor.source}
        onCancel={handleAvatarModalClose}
        onConfirm={handleAvatarConfirm}
        labels={avatarEditorLabels}
        isProcessing={avatarEditor.phase === "uploading"}
      />
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}

export default Profile;
