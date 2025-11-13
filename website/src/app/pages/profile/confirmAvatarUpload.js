import { cacheBust } from "@shared/utils";
import { normalizeAvatarFileName } from "@shared/utils/avatarFile.js";

const confirmAvatarUpload = async (
  { blob, previewUrl },
  {
    api,
    currentUser,
    editorState,
    currentAvatar,
    setAvatar,
    setUser,
    dispatch,
    previousAvatarRef,
    notifyFailure,
  },
) => {
  if (!currentUser) {
    URL.revokeObjectURL(previewUrl);
    dispatch({ type: "close" });
    return;
  }

  dispatch({ type: "startUpload" });
  previousAvatarRef.current = currentAvatar();
  setAvatar(previewUrl);

  try {
    const state = editorState();
    const preferredType = blob.type || state.fileType || "image/png";
    const normalizedName = normalizeAvatarFileName(
      state.fileName,
      preferredType,
    );
    const file = new File([blob], normalizedName, { type: preferredType });
    const data = await api.users.uploadAvatar({
      userId: currentUser.id,
      file,
      token: currentUser.token,
    });
    const url = cacheBust(data.avatar);
    setAvatar(url);
    setUser({ ...currentUser, avatar: url });
    dispatch({ type: "complete" });
  } catch (error) {
    console.error(error);
    notifyFailure();
    setAvatar(previousAvatarRef.current);
    dispatch({ type: "fail" });
  } finally {
    previousAvatarRef.current = "";
    URL.revokeObjectURL(previewUrl);
  }
};

export default confirmAvatarUpload;
export { confirmAvatarUpload };
