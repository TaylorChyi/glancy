import { useReducer } from "react";
import { avatarEditorReducer, createAvatarEditorInitialState } from "./avatarEditorState.js";
import useAvatarPreviewCleanup from "./useAvatarPreviewCleanup.js";
import useSyncedRef from "./useSyncedRef.js";

const useAvatarEditorReducer = () => {
  const [editor, dispatchEditor] = useReducer(
    avatarEditorReducer,
    undefined,
    createAvatarEditorInitialState,
  );
  const editorStateRef = useSyncedRef(editor);
  useAvatarPreviewCleanup(editor.source);

  return { editor, dispatchEditor, editorStateRef };
};

export default useAvatarEditorReducer;
export { useAvatarEditorReducer };
