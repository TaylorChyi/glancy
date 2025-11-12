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

export function conflictsReducer(state = conflictsInitialState, action) {
  switch (action.type) {
    case KEYBOARD_SHORTCUT_ACTIONS.RESET:
      return conflictsInitialState;
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_START:
      return {
        errors: {},
        lastError: null,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_SUCCESS:
      return {
        errors: {},
        lastError: null,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_FAILURE:
      return {
        errors: {},
        lastError: action.error ?? null,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_START: {
      if (!isShortcutActionPayload(action.action)) {
        return {
          ...state,
          lastError: null,
        };
      }
      return {
        ...state,
        errors: clearActionError(state.errors, action.action),
        lastError: null,
      };
    }
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS: {
      if (!isShortcutActionPayload(action.action)) {
        return {
          ...state,
          lastError: null,
        };
      }
      return {
        ...state,
        errors: clearActionError(state.errors, action.action),
        lastError: null,
      };
    }
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_FAILURE: {
      if (!isShortcutActionPayload(action.action)) {
        return {
          ...state,
          lastError: action.errorMessage ?? null,
        };
      }
      return {
        errors: {
          ...state.errors,
          [action.action]: action.errorMessage ?? null,
        },
        lastError: action.errorMessage ?? null,
      };
    }
    default:
      return state;
  }
}
