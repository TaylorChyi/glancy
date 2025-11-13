import { UsernameEditorModes } from "./usernameEditorState.js";

export const buildButtonLabel = (t, mode) => {
  if (mode === UsernameEditorModes.VIEW) {
    return t.changeUsernameButton;
  }
  if (mode === UsernameEditorModes.SAVING) {
    return t.saving;
  }
  return t.saveUsernameButton;
};
