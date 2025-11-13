import { useCallback } from "react";
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

const useAvatarChangeHandler = ({ currentUser, dispatchEditor }) =>
  useCallback(
    (event) => handleFileInput(event, { currentUser, dispatch: dispatchEditor }),
    [currentUser, dispatchEditor],
  );

const useAvatarModalCloseHandler = ({ dispatchEditor, previousAvatarRef }) =>
  useCallback(() => {
    previousAvatarRef.current = "";
    dispatchEditor({ type: "close" });
  }, [dispatchEditor, previousAvatarRef]);

const useAvatarConfirmHandler = ({
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
  useCallback(
    (payload) =>
      confirmAvatarUpload(payload, {
        api,
        currentUser,
        editorState: () => editorStateRef.current,
        currentAvatar: () => avatarRef.current,
        setAvatar,
        setUser,
        dispatch: dispatchEditor,
        previousAvatarRef,
        notifyFailure,
      }),
    [
      api,
      avatarRef,
      currentUser,
      dispatchEditor,
      editorStateRef,
      notifyFailure,
      previousAvatarRef,
      setAvatar,
      setUser,
    ],
  );

const useApplyServerAvatar = (setAvatar) =>
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
  handleAvatarChange: useAvatarChangeHandler(params),
  handleAvatarModalClose: useAvatarModalCloseHandler(params),
  handleAvatarConfirm: useAvatarConfirmHandler(params),
  applyServerAvatar: useApplyServerAvatar(params.setAvatar),
});

export default useAvatarModalHandlers;
export { useAvatarModalHandlers };
