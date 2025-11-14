import { useCallback } from "react";
import { cacheBust } from "@shared/utils";
import confirmAvatarUpload from "./confirmAvatarUpload.js";

export function openAvatarModal(event, { currentUser, dispatch }) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file || !currentUser) {
    return;
  }
  const source = URL.createObjectURL(file);
  dispatch({
    type: "open",
    payload: { source, fileName: file.name, fileType: file.type },
  });
}

export function useAvatarChange(params) {
  const { currentUser, dispatchEditor } = params;
  return useCallback(
    (event) => openAvatarModal(event, { currentUser, dispatch: dispatchEditor }),
    [currentUser, dispatchEditor],
  );
}

export function useAvatarModalClose(params) {
  const { dispatchEditor, previousAvatarRef } = params;
  return useCallback(() => {
    previousAvatarRef.current = "";
    dispatchEditor({ type: "close" });
  }, [dispatchEditor, previousAvatarRef]);
}

export function createAvatarConfirmContext({
  api,
  currentUser,
  dispatchEditor,
  editorStateRef,
  avatarRef,
  setAvatar,
  setUser,
  previousAvatarRef,
  notifyFailure,
}) {
  return {
    api,
    currentUser,
    editorState: () => editorStateRef.current,
    currentAvatar: () => avatarRef.current,
    setAvatar,
    setUser,
    dispatch: dispatchEditor,
    previousAvatarRef,
    notifyFailure,
  };
}

export function useAvatarConfirm(params) {
  return useCallback(
    (payload) =>
      confirmAvatarUpload(
        payload,
        createAvatarConfirmContext({
          api: params.api,
          currentUser: params.currentUser,
          dispatchEditor: params.dispatchEditor,
          editorStateRef: params.editorStateRef,
          avatarRef: params.avatarRef,
          setAvatar: params.setAvatar,
          setUser: params.setUser,
          previousAvatarRef: params.previousAvatarRef,
          notifyFailure: params.notifyFailure,
        }),
      ),
    [
      params.api,
      params.avatarRef,
      params.currentUser,
      params.dispatchEditor,
      params.editorStateRef,
      params.notifyFailure,
      params.previousAvatarRef,
      params.setAvatar,
      params.setUser,
    ],
  );
}

export function useApplyServerAvatar(setAvatar) {
  return useCallback(
    (nextAvatar) => {
      if (!nextAvatar) {
        setAvatar("");
        return;
      }
      setAvatar(cacheBust(nextAvatar));
    },
    [setAvatar],
  );
}

export function useAvatarModalHandlers(params) {
  return {
    handleAvatarChange: useAvatarChange(params),
    handleAvatarModalClose: useAvatarModalClose(params),
    handleAvatarConfirm: useAvatarConfirm(params),
    applyServerAvatar: useApplyServerAvatar(params.setAvatar),
  };
}

export default useAvatarModalHandlers;
