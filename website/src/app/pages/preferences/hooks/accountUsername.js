import { useCallback, useReducer } from "react";

const resolve = (translations, primaryKey, fallbackKey, fallback) => {
  if (primaryKey && typeof translations[primaryKey] === "string") {
    return translations[primaryKey];
  }
  if (fallbackKey && typeof translations[fallbackKey] === "string") {
    return translations[fallbackKey];
  }
  return fallback;
};

const createTranslationEntry = (key, primaryKey, fallbackKey, fallback) => ({
  key,
  primaryKey,
  fallbackKey,
  fallback,
});

const USERNAME_TRANSLATION_ENTRIES = [
  createTranslationEntry(
    "usernamePlaceholder",
    "usernamePlaceholder",
    "settingsAccountUsername",
    "Enter username",
  ),
  createTranslationEntry(
    "changeUsernameButton",
    "changeUsernameButton",
    "settingsManageProfile",
    "Change username",
  ),
  createTranslationEntry(
    "saveUsernameButton",
    "saveUsernameButton",
    null,
    "Save username",
  ),
  createTranslationEntry("saving", "saving", null, "Saving..."),
  createTranslationEntry(
    "usernameValidationEmpty",
    "usernameValidationEmpty",
    null,
    "Username cannot be empty",
  ),
  createTranslationEntry(
    "usernameValidationTooShort",
    "usernameValidationTooShort",
    null,
    "Username is too short",
  ),
  createTranslationEntry(
    "usernameValidationTooLong",
    "usernameValidationTooLong",
    null,
    "Username is too long",
  ),
  createTranslationEntry(
    "usernameUpdateFailed",
    "usernameUpdateFailed",
    null,
    "Unable to update username",
  ),
];

const mapTranslationEntry = (translations, entry) => [
  entry.key,
  resolve(translations, entry.primaryKey, entry.fallbackKey, entry.fallback),
];

export const createUsernameEditorTranslations = (translations) =>
  Object.fromEntries(
    USERNAME_TRANSLATION_ENTRIES.map((entry) =>
      mapTranslationEntry(translations, entry),
    ),
  );

const COMMAND_INITIAL_STATE = Object.freeze({
  status: "idle",
  lastError: null,
});

const usernameCommandReducer = (state, action) => {
  switch (action.type) {
    case "submit/start":
      return { status: "pending", lastError: null };
    case "submit/success":
      return { status: "idle", lastError: null };
    case "submit/failure":
      return { status: "failed", lastError: action.error };
    default:
      return state;
  }
};

const ensureSession = (user) => {
  if (!user?.id || !user?.token) {
    throw new Error("User session is unavailable");
  }
};

const persistUsername = async ({
  user,
  setUser,
  updateUsernameRequest,
  nextUsername,
}) => {
  if (typeof updateUsernameRequest !== "function") {
    if (typeof setUser === "function") {
      setUser({ ...user, username: nextUsername });
    }
    return nextUsername;
  }

  const response = await updateUsernameRequest({
    userId: user.id,
    username: nextUsername,
    token: user.token,
  });

  const resolvedUsername =
    typeof response?.username === "string"
      ? response.username
      : nextUsername;

  if (typeof setUser === "function") {
    setUser({ ...user, username: resolvedUsername });
  }

  return resolvedUsername;
};

const useUsernameFailureHandler = (dispatch) =>
  useCallback(
    (error) => {
      dispatch({ type: "submit/failure", error });
      console.error("Failed to update username from preferences", error);
    },
    [dispatch],
  );

const useUsernameSubmitHandler = ({
  dispatch,
  user,
  setUser,
  updateUsernameRequest,
  handleUsernameFailure,
}) =>
  useCallback(
    async (nextUsername) => {
      ensureSession(user);
      dispatch({ type: "submit/start" });
      try {
        const resolvedUsername = await persistUsername({
          user,
          setUser,
          updateUsernameRequest,
          nextUsername,
        });
        dispatch({ type: "submit/success" });
        return resolvedUsername;
      } catch (error) {
        handleUsernameFailure(error);
        throw error;
      }
    },
    [dispatch, handleUsernameFailure, setUser, updateUsernameRequest, user],
  );

const useUsernameCommandHandlers = ({
  dispatch,
  user,
  setUser,
  updateUsernameRequest,
}) => {
  const handleUsernameFailure = useUsernameFailureHandler(dispatch);

  const handleUsernameSubmit = useUsernameSubmitHandler({
    dispatch,
    user,
    setUser,
    updateUsernameRequest,
    handleUsernameFailure,
  });

  return { handleUsernameSubmit, handleUsernameFailure };
};

export const useUsernameSubmitCommand = ({
  user,
  setUser,
  updateUsernameRequest,
}) => {
  const [commandState, dispatch] = useReducer(
    usernameCommandReducer,
    COMMAND_INITIAL_STATE,
  );

  const { handleUsernameSubmit, handleUsernameFailure } =
    useUsernameCommandHandlers({
      dispatch,
      user,
      setUser,
      updateUsernameRequest,
    });

  return { handleUsernameSubmit, handleUsernameFailure, commandState };
};
