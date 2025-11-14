import { cacheBust } from "@shared/utils";
import { normalizeAvatarFileName } from "@shared/utils/avatarFile.js";

export function ensureAvatarUploadPreconditions(
  { previewUrl },
  { currentUser, dispatch },
) {
  if (currentUser) {
    return true;
  }
  URL.revokeObjectURL(previewUrl);
  dispatch({ type: "close" });
  return false;
}

export async function executeAvatarUpload(
  { blob },
  { api, currentUser, editorState },
) {
  const state = editorState();
  const preferredType = blob.type || state.fileType || "image/png";
  const normalizedName = normalizeAvatarFileName(state.fileName, preferredType);
  const file = new File([blob], normalizedName, { type: preferredType });
  const data = await api.users.uploadAvatar({
    userId: currentUser.id,
    file,
    token: currentUser.token,
  });
  return cacheBust(data.avatar);
}

export function handleAvatarUploadFailure(
  error,
  { notifyFailure, setAvatar, previousAvatarRef, dispatch },
) {
  console.error(error);
  notifyFailure();
  setAvatar(previousAvatarRef.current);
  dispatch({ type: "fail" });
}

export function beginAvatarUpload(
  { previewUrl },
  { dispatch, previousAvatarRef, currentAvatar, setAvatar },
) {
  dispatch({ type: "startUpload" });
  previousAvatarRef.current = currentAvatar();
  setAvatar(previewUrl);
}

export function applyAvatarUploadSuccess(
  avatarUrl,
  { currentUser, setAvatar, setUser, dispatch },
) {
  setAvatar(avatarUrl);
  setUser({ ...currentUser, avatar: avatarUrl });
  dispatch({ type: "complete" });
}

export function finalizeAvatarUpload(previewUrl, previousAvatarRef) {
  previousAvatarRef.current = "";
  URL.revokeObjectURL(previewUrl);
}

const confirmAvatarUpload = async (payload, context) => {
  const { currentUser, dispatch } = context;
  if (!ensureAvatarUploadPreconditions(payload, { currentUser, dispatch })) {
    return;
  }

  beginAvatarUpload(payload, context);

  try {
    const avatarUrl = await executeAvatarUpload(payload, {
      api: context.api,
      currentUser,
      editorState: context.editorState,
    });
    applyAvatarUploadSuccess(avatarUrl, context);
  } catch (error) {
    handleAvatarUploadFailure(error, context);
  } finally {
    finalizeAvatarUpload(payload.previewUrl, context.previousAvatarRef);
  }
};

export default confirmAvatarUpload;
export { confirmAvatarUpload };
