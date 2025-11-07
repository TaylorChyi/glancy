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
