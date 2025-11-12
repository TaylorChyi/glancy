import { KEYBOARD_SHORTCUT_ACTIONS } from "../../keyboardShortcutActions.js";

const cloneList = (shortcuts = []) =>
  Array.isArray(shortcuts)
    ? shortcuts.map((shortcut) => ({
        ...shortcut,
        keys: Array.isArray(shortcut.keys) ? [...shortcut.keys] : [],
        defaultKeys: Array.isArray(shortcut.defaultKeys)
          ? [...shortcut.defaultKeys]
          : [],
      }))
    : [];

const buildState = (shortcuts) => ({
  list: cloneList(shortcuts),
});

export const shortcutsInitialState = buildState([]);

export function createShortcutsState(shortcuts) {
  return buildState(shortcuts);
}

export function shortcutsReducer(state = shortcutsInitialState, action) {
  switch (action.type) {
    case KEYBOARD_SHORTCUT_ACTIONS.RESET: {
      if (Array.isArray(action.payload)) {
        return createShortcutsState(action.payload);
      }
      return shortcutsInitialState;
    }
    case KEYBOARD_SHORTCUT_ACTIONS.LOAD_SUCCESS:
    case KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS: {
      if (Array.isArray(action.payload)) {
        return createShortcutsState(action.payload);
      }
      return state;
    }
    default:
      return state;
  }
}
