import { cacheBust } from "@shared/utils";

export const AVATAR_UPLOAD_ERRORS = Object.freeze({
  missingUser: "avatar-upload-missing-user",
  missingClient: "avatar-upload-missing-client",
});

export const normalizeFiles = (files) => {
  if (!files) {
    return [];
  }
  if (typeof files[Symbol.iterator] === "function") {
    return Array.from(files);
  }
  if (typeof files.length === "number") {
    return Array.from({ length: files.length }, (_, index) => files[index]);
  }
  return Array.isArray(files) ? files : [files];
};

export const selectFirstValidFile = (filesLike) =>
  normalizeFiles(filesLike).filter(Boolean)[0] ?? null;

export const prepareAvatarUpload = ({ filesLike, user, usersClient }) => {
  const file = selectFirstValidFile(filesLike);
  if (!file) {
    return null;
  }

  const context = assertUploadContext({ user, usersClient });
  return { file, context };
};

export function assertUploadContext({ user, usersClient }) {
  if (!user || !user.id || !user.token) {
    const missingUserError = new Error(AVATAR_UPLOAD_ERRORS.missingUser);
    missingUserError.code = AVATAR_UPLOAD_ERRORS.missingUser;
    throw missingUserError;
  }

  if (!usersClient || typeof usersClient.uploadAvatar !== "function") {
    throw new Error(AVATAR_UPLOAD_ERRORS.missingClient);
  }

  return { user, usersClient };
}

export async function uploadAvatar({ usersClient, user, file }) {
  return usersClient.uploadAvatar({
    userId: user.id,
    token: user.token,
    file,
  });
}

export const beginAvatarUpload = ({ setStatus, setError, statusMap }) => {
  setStatus(statusMap.uploading);
  if (typeof setError === "function") {
    setError(null);
  }
};

export const resolveUploadedAvatar = (response) => {
  const avatar = response?.avatar ? cacheBust(response.avatar) : null;
  return avatar ?? null;
};

export const applyAvatarUploadSuccess = ({
  context,
  response,
  setStatus,
  setUser,
  onSuccess,
  statusMap,
}) => {
  const nextAvatar = resolveUploadedAvatar(response);

  if (nextAvatar && typeof setUser === "function") {
    setUser({ ...context.user, avatar: nextAvatar });
  }

  setStatus(statusMap.succeeded);

  if (typeof onSuccess === "function") {
    onSuccess({ avatar: nextAvatar, response });
  }

  return true;
};

export const applyAvatarUploadFailure = ({
  error,
  setStatus,
  setError,
  onError,
  statusMap,
}) => {
  setStatus(statusMap.failed);
  setError(error);

  if (typeof onError === "function") {
    onError(error);
  }

  return false;
};

export const orchestrateAvatarUpload = async (options) => {
  const {
    setStatus,
    setError,
    setUser,
    onSuccess,
    onError,
    statusMap,
  } = options;

  try {
    const prepared = prepareAvatarUpload(options);
    if (!prepared) {
      return false;
    }

    const { file, context } = prepared;

    beginAvatarUpload({ setStatus, setError, statusMap });

    const response = await uploadAvatar({
      ...context,
      file,
    });

    return applyAvatarUploadSuccess({
      context,
      response,
      setStatus,
      setUser,
      onSuccess,
      statusMap,
    });
  } catch (error) {
    return applyAvatarUploadFailure({
      error,
      setStatus,
      setError,
      onError,
      statusMap,
    });
  }
};

export const performAvatarUpload = orchestrateAvatarUpload;
