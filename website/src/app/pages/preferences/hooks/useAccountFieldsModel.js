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
    [
      accountSnapshot,
      handleEmailUnbind,
      isEmailUnbinding,
      translations,
    ],
  );

const useAccountFieldDependencies = ({
  translations,
  accountSnapshot,
  handleEmailUnbind,
  isEmailUnbinding,
  updateUsernameRequest,
  setUser,
  user,
}) => {
  const usernameHandlers = useUsernameEditorHandlers({
    translations,
    user,
    setUser,
    updateUsernameRequest,
  });

  const emailAction = useEmailFieldAction({
    translations,
    accountSnapshot,
    handleEmailUnbind,
    isEmailUnbinding,
  });

  return { ...usernameHandlers, emailAction };
};

const useAccountFieldBuilder = ({
  translations,
  accountSnapshot,
  fallbackValue,
  usernameEditorTranslations,
  handleUsernameSubmit,
  handleUsernameFailure,
  emailAction,
}) =>
  useMemo(
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

const useAccountFieldsModelValue = (props) => {
  const dependencies = useAccountFieldDependencies(props);

  return useAccountFieldBuilder({ ...props, ...dependencies });
};

export const useAccountFieldsModel = (props) =>
  useAccountFieldsModelValue(props);
