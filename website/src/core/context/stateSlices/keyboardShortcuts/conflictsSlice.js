import {
  KEYBOARD_SHORTCUT_ACTIONS,
  isShortcutActionPayload,
} from "../../keyboardShortcutActions.js";

export const conflictsInitialState = {
  errors: {},
  lastError: null,
};

const clearActionError = (errors, actionId) => {
  if (!actionId || !Object.prototype.hasOwnProperty.call(errors, actionId)) {
    return errors;
  }
  const nextErrors = { ...errors };
  nextErrors[actionId] = null;
  return nextErrors;
};

const resetConflictsState = (lastError = null) => ({
  errors: {},
  lastError,
});

const applyUpdateProgress = (state, action) => {
  if (!isShortcutActionPayload(action.action)) {
    return { ...state, lastError: null };
  }
  return {
    ...state,
    errors: clearActionError(state.errors, action.action),
    lastError: null,
  };
};

const applyUpdateFailure = (state, action) => {
  const nextError = action.errorMessage ?? null;
  if (!isShortcutActionPayload(action.action)) {
    return { ...state, lastError: nextError };
  }
  return {
    errors: {
      ...state.errors,
      [action.action]: nextError,
    },
    lastError: nextError,
  };
};

const conflictActionHandlers = {
  [KEYBOARD_SHORTCUT_ACTIONS.RESET]: () => conflictsInitialState,
  [KEYBOARD_SHORTCUT_ACTIONS.LOAD_START]: () => resetConflictsState(),
  [KEYBOARD_SHORTCUT_ACTIONS.LOAD_SUCCESS]: () => resetConflictsState(),
  [KEYBOARD_SHORTCUT_ACTIONS.LOAD_FAILURE]: (_state, action) =>
    resetConflictsState(action.error ?? null),
  [KEYBOARD_SHORTCUT_ACTIONS.UPDATE_START]: applyUpdateProgress,
  [KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS]: applyUpdateProgress,
  [KEYBOARD_SHORTCUT_ACTIONS.UPDATE_FAILURE]: applyUpdateFailure,
};

export function conflictsReducer(state = conflictsInitialState, action) {
  const handler = conflictActionHandlers[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action);
}
