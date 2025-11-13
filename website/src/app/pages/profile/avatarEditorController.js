import { useMemo, useRef, useState } from "react";
import useAvatarEditorReducer from "./useAvatarEditorReducer.js";
import useAvatarModalHandlers from "./useAvatarModalHandlers.js";
import useSyncedRef from "./useSyncedRef.js";

export {
  avatarEditorInitialState,
  avatarEditorReducer,
  createAvatarEditorInitialState,
} from "./avatarEditorState.js";

const createLabels = (t) => ({
  title: t.avatarEditorTitle,
  description: t.avatarEditorDescription,
  zoomIn: t.avatarZoomIn,
  zoomOut: t.avatarZoomOut,
  cancel: t.avatarCancel,
  confirm: t.avatarConfirm,
});

export function useAvatarEditorController({
  api,
  currentUser,
  setUser,
  t,
  notifyFailure,
}) {
  const [avatar, setAvatar] = useState("");
  const avatarRef = useSyncedRef(avatar);
  const previousAvatarRef = useRef("");
  const { editor, dispatchEditor, editorStateRef } = useAvatarEditorReducer();

  const labels = useMemo(() => createLabels(t), [t]);

  const handlers = useAvatarModalHandlers({
    api,
    currentUser,
    setUser,
    setAvatar,
    dispatchEditor,
    editorStateRef,
    avatarRef,
    previousAvatarRef,
    notifyFailure,
  });

  return {
    avatar,
    editor,
    labels,
    ...handlers,
  };
}
