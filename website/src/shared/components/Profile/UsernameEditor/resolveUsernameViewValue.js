import { UsernameEditorModes } from "./usernameEditorState.js";

export const resolveViewValue = (mode, value, emptyDisplayValue) => {
  if (mode !== UsernameEditorModes.VIEW) {
    return value;
  }
  if (!value || value.trim().length === 0) {
    return emptyDisplayValue ?? "";
  }
  return value;
};
