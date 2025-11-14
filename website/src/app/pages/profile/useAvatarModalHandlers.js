import { useCallback, useMemo } from "react";
import { cacheBust } from "@shared/utils";
import confirmAvatarUpload from "./confirmAvatarUpload.js";

const handleFileInput = (event, { currentUser, dispatch }) => {
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
};

const buildConfirmContext = ({
  api,
  currentUser,
  dispatchEditor,
  editorStateRef,
  avatarRef,
  setAvatar,
  setUser,
  previousAvatarRef,
  notifyFailure,
}) => ({
  api,
  currentUser,
  editorState: () => editorStateRef.current,
  currentAvatar: () => avatarRef.current,
  setAvatar,
  setUser,
  dispatch: dispatchEditor,
  previousAvatarRef,
  notifyFailure,
});

const useConfirmContext = ({
  api,
  currentUser,
  dispatchEditor,
  editorStateRef,
  avatarRef,
  setAvatar,
  setUser,
  previousAvatarRef,
  notifyFailure,
}) =>
  useMemo(
    () =>
      buildConfirmContext({
        api,
        currentUser,
        dispatchEditor,
        editorStateRef,
        avatarRef,
        setAvatar,
        setUser,
        previousAvatarRef,
        notifyFailure,
      }),
    [api, currentUser, dispatchEditor, editorStateRef, avatarRef, setAvatar, setUser, previousAvatarRef, notifyFailure],
  );

export const useAvatarChange = ({ currentUser, dispatchEditor }) =>
  useCallback(
    (event) => handleFileInput(event, { currentUser, dispatch: dispatchEditor }),
    [currentUser, dispatchEditor],
  );

export const useAvatarModalClose = ({ dispatchEditor, previousAvatarRef }) =>
  useCallback(() => {
    previousAvatarRef.current = "";
    dispatchEditor({ type: "close" });
  }, [dispatchEditor, previousAvatarRef]);

export const useAvatarConfirm = (params) => {
  const context = useConfirmContext(params);
  return useCallback((payload) => confirmAvatarUpload(payload, context), [context]);
};

export const useApplyServerAvatar = (setAvatar) =>
  useCallback(
    (nextAvatar) => {
      if (!nextAvatar) {
        setAvatar("");
        return;
      }
      setAvatar(cacheBust(nextAvatar));
    },
    [setAvatar],
  );

const useAvatarModalHandlers = (params) => ({
  handleAvatarChange: useAvatarChange(params),
  handleAvatarModalClose: useAvatarModalClose(params),
  handleAvatarConfirm: useAvatarConfirm(params),
  applyServerAvatar: useApplyServerAvatar(params.setAvatar),
});

export default useAvatarModalHandlers;
export { useAvatarModalHandlers };
