export const KEYBOARD_SHORTCUT_ACTIONS = {
  RESET: "reset",
  LOAD_START: "load_start",
  LOAD_SUCCESS: "load_success",
  LOAD_FAILURE: "load_failure",
  UPDATE_START: "update_start",
  UPDATE_SUCCESS: "update_success",
  UPDATE_FAILURE: "update_failure",
};

export function isShortcutActionPayload(action) {
  return typeof action === "string" && action.trim().length > 0;
}
