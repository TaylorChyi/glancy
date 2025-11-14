import { cacheBust } from "@shared/utils";
import { normalizeAvatarFileName } from "@shared/utils/avatarFile.js";

const handleAvatarUploadPreconditions = (
  previewUrl,
  { currentUser, dispatch, currentAvatar, previousAvatarRef, setAvatar },
) => {
  if (!currentUser) {
    URL.revokeObjectURL(previewUrl);
    dispatch({ type: "close" });
    return { shouldAbort: true };
  }

  dispatch({ type: "startUpload" });
  previousAvatarRef.current = currentAvatar();
  setAvatar(previewUrl);
  return { shouldAbort: false };
};

const buildAvatarFile = (blob, state) => {
  const preferredType = blob.type || state.fileType || "image/png";
  const normalizedName = normalizeAvatarFileName(state.fileName, preferredType);
  return new File([blob], normalizedName, { type: preferredType });
};

const executeAvatarUpload = async (
  blob,
  { api, currentUser, editorState },
) => {
  const state = editorState();
  const file = buildAvatarFile(blob, state);
  const data = await api.users.uploadAvatar({
    userId: currentUser.id,
    file,
    token: currentUser.token,
  });
  return cacheBust(data.avatar);
};

const handleAvatarUploadFailure = (
  error,
  { notifyFailure, setAvatar, previousAvatarRef, dispatch },
) => {
  console.error(error);
  notifyFailure();
  setAvatar(previousAvatarRef.current);
  dispatch({ type: "fail" });
};

const cleanupAvatarUpload = (previewUrl, previousAvatarRef) => {
  previousAvatarRef.current = "";
  URL.revokeObjectURL(previewUrl);
};

const confirmAvatarUpload = async (
  { blob, previewUrl },
  context,
) => {
  const { shouldAbort } = handleAvatarUploadPreconditions(previewUrl, context);
  if (shouldAbort) {
    return;
  }

  try {
    const url = await executeAvatarUpload(blob, context);
    context.setAvatar(url);
    context.setUser({ ...context.currentUser, avatar: url });
    context.dispatch({ type: "complete" });
  } catch (error) {
    handleAvatarUploadFailure(error, context);
  } finally {
    cleanupAvatarUpload(previewUrl, context.previousAvatarRef);
  }
};

export default confirmAvatarUpload;
export {
  confirmAvatarUpload,
  handleAvatarUploadPreconditions,
  executeAvatarUpload,
  handleAvatarUploadFailure,
  cleanupAvatarUpload,
};
