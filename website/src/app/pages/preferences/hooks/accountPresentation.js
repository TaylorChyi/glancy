/**
 * 背景：
 *  - 账户分区需要聚合字段、头像与第三方绑定信息，若散落在 Hook 中难以维护。
 * 目的：
 *  - 封装字段、身份与绑定蓝图的创建逻辑，保证输出结构稳定。
 * 关键决策与取舍：
 *  - 通过独立工厂函数生成字段与动作，便于未来按需扩展；
 *  - 避免在工厂中执行副作用，保持纯函数特性。
 */
import {
  ACCOUNT_STATIC_FIELD_TYPE,
  ACCOUNT_USERNAME_FIELD_TYPE,
} from "../sections/accountSection.constants.js";

export const createEmailAction = ({
  translations,
  accountSnapshot,
  handleEmailUnbind,
  isEmailUnbinding,
}) => ({
  id: "unbind-email",
  label:
    translations.settingsAccountEmailUnbindAction ??
    translations.settingsAccountEmailUnbind ??
    "Unbind email",
  disabled: !accountSnapshot.hasBoundEmail,
  onClick: handleEmailUnbind,
  isPending: isEmailUnbinding,
  pendingLabel:
    translations.settingsAccountEmailUnbinding ??
    translations.emailUnbinding ??
    "Removing…",
});

export const buildUsernameField = ({
  translations,
  accountSnapshot,
  fallbackValue,
  usernameEditorTranslations,
  handleUsernameSubmit,
  handleUsernameFailure,
}) => ({
  id: "username",
  label: translations.settingsAccountUsername ?? "Username",
  value: accountSnapshot.usernameValue,
  type: ACCOUNT_USERNAME_FIELD_TYPE,
  usernameEditorProps: {
    username: accountSnapshot.sanitizedUsername,
    emptyDisplayValue: fallbackValue,
    t: usernameEditorTranslations,
    onSubmit: handleUsernameSubmit,
    onFailure: handleUsernameFailure,
  },
});

export const buildEmailField = ({ translations, accountSnapshot, emailAction }) => ({
  id: "email",
  label: translations.settingsAccountEmail ?? "Email",
  value: accountSnapshot.emailValue,
  type: ACCOUNT_STATIC_FIELD_TYPE,
  readOnlyInputProps: {
    type: "email",
    inputMode: "email",
    autoComplete: "email",
  },
  action: emailAction,
});

export const buildPhoneField = (translations, accountSnapshot) => ({
  id: "phone",
  label: translations.settingsAccountPhone ?? "Phone",
  value: accountSnapshot.phoneValue,
  type: ACCOUNT_STATIC_FIELD_TYPE,
  readOnlyInputProps: {
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel",
  },
  action: {
    id: "rebind-phone",
    label: translations.settingsAccountPhoneRebindAction ?? "Change phone",
    disabled: true,
  },
});

export const createAccountIdentity = ({
  translations,
  accountSnapshot,
  accountCopy,
  onAvatarSelection,
  isAvatarUploading,
}) => ({
  label: translations.settingsAccountAvatarLabel ?? "Avatar",
  displayName: accountSnapshot.usernameValue,
  changeLabel: accountCopy.changeAvatarLabel,
  avatarAlt:
    translations.prefAccountTitle ??
    translations.settingsTabAccount ??
    "Account",
  onSelectAvatar: onAvatarSelection,
  isUploading: isAvatarUploading,
});

export const createAccountBindings = ({ translations, accountCopy }) => ({
  title: accountCopy.bindingsTitle,
  items: [
    {
      id: "apple",
      name: translations.settingsAccountBindingApple ?? "Apple",
      status: accountCopy.bindingStatus,
      actionLabel: accountCopy.bindingActionLabel,
    },
    {
      id: "google",
      name: translations.settingsAccountBindingGoogle ?? "Google",
      status: accountCopy.bindingStatus,
      actionLabel: accountCopy.bindingActionLabel,
    },
    {
      id: "wechat",
      name: translations.settingsAccountBindingWeChat ?? "WeChat",
      status: accountCopy.bindingStatus,
      actionLabel: accountCopy.bindingActionLabel,
    },
  ],
});
