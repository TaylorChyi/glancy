import { useMemo } from "react";
import {
  buildEmailField,
  buildPhoneField,
  buildUsernameField,
  createEmailAction,
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

const useUsernameEditorHandlers = ({
  translations,
  user,
  setUser,
  updateUsernameRequest,
}) => {
  const usernameEditorTranslations = useMemo(
    () => createUsernameEditorTranslations(translations),
    [translations],
  );

  const { handleUsernameSubmit, handleUsernameFailure } =
    useUsernameSubmitCommand({ user, setUser, updateUsernameRequest });

  return { usernameEditorTranslations, handleUsernameSubmit, handleUsernameFailure };
};

const useEmailFieldAction = ({
  translations,
  accountSnapshot,
  handleEmailUnbind,
  isEmailUnbinding,
}) =>
  useMemo(
    () =>
      createEmailAction({
        translations,
        accountSnapshot,
        handleEmailUnbind,
        isEmailUnbinding,
      }),
    [accountSnapshot, handleEmailUnbind, isEmailUnbinding, translations],
  );

export const useAccountFieldsModel = ({
  translations,
  accountSnapshot,
  fallbackValue,
  handleEmailUnbind,
  isEmailUnbinding,
  updateUsernameRequest,
  setUser,
  user,
}) => {
  const { usernameEditorTranslations, handleUsernameSubmit, handleUsernameFailure } =
    useUsernameEditorHandlers({ translations, user, setUser, updateUsernameRequest });

  const emailAction = useEmailFieldAction({ translations, accountSnapshot, handleEmailUnbind, isEmailUnbinding });

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
    [accountSnapshot, emailAction, fallbackValue, handleUsernameFailure, handleUsernameSubmit, translations, usernameEditorTranslations],
  );
};
