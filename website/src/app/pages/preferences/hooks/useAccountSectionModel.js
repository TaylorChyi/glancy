/**
 * 背景：
 *  - 账户分区包含字段派生、解绑命令、用户名编辑等多重职责，
 *    原本杂糅在 usePreferenceSections.js 中导致主 Hook 过长。
 * 目的：
 *  - 将账户分区的模型抽离为 Hook，输出结构化的字段、身份与绑定信息，
 *    便于未来扩展多端复用。
 * 关键决策与取舍：
 *  - 使用局部蓝图与命令对象保证每个子职责独立，降低复杂度；
 *  - 输出纯数据结构，方便页面或模态直接消费。
 * 影响范围：
 *  - 偏好设置页面账户分区组件。
 * 演进与TODO：
 *  - 后续可在此引入手机换绑流程或第三方绑定状态同步。
 */
import { useMemo } from "react";
import {
  buildAccountSnapshot,
  useEmailUnbindCommand,
} from "./accountSnapshot.js";
import {
  createAccountBindings,
  createAccountIdentity,
  createEmailAction,
  buildEmailField,
  buildPhoneField,
  buildUsernameField,
} from "./accountPresentation.js";
import {
  createUsernameEditorTranslations,
  useUsernameSubmitCommand,
} from "./accountUsername.js";

const createAccountFields = ({
  translations,
  accountSnapshot,
  fallbackValue,
  usernameEditorTranslations,
  handleUsernameSubmit,
  handleUsernameFailure,
  emailAction,
}) => [
  buildUsernameField({
    translations,
    accountSnapshot,
    fallbackValue,
    usernameEditorTranslations,
    handleUsernameSubmit,
    handleUsernameFailure,
  }),
  buildEmailField({ translations, accountSnapshot, emailAction }),
  buildPhoneField(translations, accountSnapshot),
];

const useAccountFields = ({
  translations,
  accountSnapshot,
  fallbackValue,
  handleEmailUnbind,
  isEmailUnbinding,
  updateUsernameRequest,
  setUser,
  user,
}) => {
  const usernameEditorTranslations = useMemo(
    () => createUsernameEditorTranslations(translations),
    [translations],
  );

  const { handleUsernameSubmit, handleUsernameFailure } =
    useUsernameSubmitCommand({
      user,
      setUser,
      updateUsernameRequest,
    });

  const emailAction = useMemo(
    () =>
      createEmailAction({
        translations,
        accountSnapshot,
        handleEmailUnbind,
        isEmailUnbinding,
      }),
    [accountSnapshot, handleEmailUnbind, isEmailUnbinding, translations],
  );

  return useMemo(
    () =>
      createAccountFields({
        translations,
        accountSnapshot,
        fallbackValue,
        usernameEditorTranslations,
        handleUsernameSubmit,
        handleUsernameFailure,
        emailAction,
      }),
    [
      accountSnapshot,
      emailAction,
      fallbackValue,
      handleUsernameFailure,
      handleUsernameSubmit,
      translations,
      usernameEditorTranslations,
    ],
  );
};

export const useAccountSectionModel = ({
  translations,
  fallbackValue,
  accountCopy,
  emailBinding,
  onAvatarSelection,
  isAvatarUploading,
  updateUsernameRequest,
  setUser,
  user,
}) => {
  const accountSnapshot = useMemo(
    () =>
      buildAccountSnapshot({
        user,
        fallbackValue,
        defaultPhoneCode: accountCopy.defaultPhoneCode,
      }),
    [accountCopy.defaultPhoneCode, fallbackValue, user],
  );

  const { handleEmailUnbind, isEmailUnbinding } = useEmailUnbindCommand({
    accountSnapshot,
    emailBinding,
  });

  const fields = useAccountFields({
    translations,
    accountSnapshot,
    fallbackValue,
    handleEmailUnbind,
    isEmailUnbinding,
    updateUsernameRequest,
    setUser,
    user,
  });

  const identity = useMemo(
    () =>
      createAccountIdentity({
        translations,
        accountSnapshot,
        accountCopy,
        onAvatarSelection,
        isAvatarUploading,
      }),
    [
      accountCopy,
      accountSnapshot,
      isAvatarUploading,
      onAvatarSelection,
      translations,
    ],
  );

  const bindings = useMemo(
    () => createAccountBindings({ translations, accountCopy }),
    [accountCopy, translations],
  );

  return { fields, identity, bindings };
};
