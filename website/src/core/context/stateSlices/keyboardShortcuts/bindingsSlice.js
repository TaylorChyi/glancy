import { KEYBOARD_SHORTCUT_ACTIONS } from "../../keyboardShortcutActions.js";

export const bindingsInitialState = {
  status: "idle",
  pendingAction: null,
};

export function bindingsReducer(state = bindingsInitialState, action) {
  switch (action.type) {
    case KEYBOARD_SHORTCUT_ACTIONS.RESET:
      return bindingsInitialState;
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_START:
      return {
        status: "loading",
        pendingAction: null,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_SUCCESS:
      return {
        status: "ready",
        pendingAction: null,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_FAILURE:
      return {
        status: "error",
        pendingAction: null,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_START:
      return {
        ...state,
        pendingAction:
          typeof action.action === "string" ? action.action : action.actionId,
      };
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS:
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_FAILURE:
      return {
        ...state,
        pendingAction: null,
      };
    default:
      return state;
  }
}
