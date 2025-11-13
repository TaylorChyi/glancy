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

export const createUsernameEditorTranslations = (translations) => ({
  usernamePlaceholder: resolve(
    translations,
    "usernamePlaceholder",
    "settingsAccountUsername",
    "Enter username",
  ),
  changeUsernameButton: resolve(
    translations,
    "changeUsernameButton",
    "settingsManageProfile",
    "Change username",
  ),
  saveUsernameButton: resolve(
    translations,
    "saveUsernameButton",
    null,
    "Save username",
  ),
  saving: resolve(translations, "saving", null, "Saving..."),
  usernameValidationEmpty: resolve(
    translations,
    "usernameValidationEmpty",
    null,
    "Username cannot be empty",
  ),
  usernameValidationTooShort: resolve(
    translations,
    "usernameValidationTooShort",
    null,
    "Username is too short",
  ),
  usernameValidationTooLong: resolve(
    translations,
    "usernameValidationTooLong",
    null,
    "Username is too long",
  ),
  usernameUpdateFailed: resolve(
    translations,
    "usernameUpdateFailed",
    null,
    "Unable to update username",
  ),
});

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

export const useUsernameSubmitCommand = ({
  user,
  setUser,
  updateUsernameRequest,
}) => {
  const [commandState, dispatch] = useReducer(
    usernameCommandReducer,
    COMMAND_INITIAL_STATE,
  );

  const handleUsernameFailure = useCallback((error) => {
    dispatch({ type: "submit/failure", error });
    console.error("Failed to update username from preferences", error);
  }, []);

  const handleUsernameSubmit = useCallback(
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
    [handleUsernameFailure, setUser, updateUsernameRequest, user],
  );

  return { handleUsernameSubmit, handleUsernameFailure, commandState };
};
