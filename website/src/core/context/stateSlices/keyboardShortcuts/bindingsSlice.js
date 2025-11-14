import { KEYBOARD_SHORTCUT_ACTIONS } from "../../keyboardShortcutActions.js";

export const bindingsInitialState = {
  status: "idle",
  pendingAction: null,
};

const pendingActionFrom = (action) =>
  typeof action.action === "string" ? action.action : action.actionId;

const createStatusState = (status) => ({
  status,
  pendingAction: null,
});

const bindingsHandlers = {
  [KEYBOARD_SHORTCUT_ACTIONS.RESET]: () => bindingsInitialState,
  [KEYBOARD_SHORTCUT_ACTIONS.LOAD_START]: () => createStatusState("loading"),
  [KEYBOARD_SHORTCUT_ACTIONS.LOAD_SUCCESS]: () => createStatusState("ready"),
  [KEYBOARD_SHORTCUT_ACTIONS.LOAD_FAILURE]: () => createStatusState("error"),
  [KEYBOARD_SHORTCUT_ACTIONS.UPDATE_START]: (state, action) => ({
    ...state,
    pendingAction: pendingActionFrom(action),
  }),
  [KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS]: (state) => ({
    ...state,
    pendingAction: null,
  }),
  [KEYBOARD_SHORTCUT_ACTIONS.UPDATE_FAILURE]: (state) => ({
    ...state,
    pendingAction: null,
  }),
};

export function bindingsReducer(state = bindingsInitialState, action) {
  const handler = bindingsHandlers[action.type];
  return handler ? handler(state, action) : state;
}
