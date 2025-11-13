import { UsernameEditorModes } from "./usernameEditorState.js";

export const createActionDescriptor = (label, handlers, mode) => ({
  label,
  onClick: handlers.handleButtonClick,
  disabled: mode === UsernameEditorModes.SAVING,
  mode,
});
