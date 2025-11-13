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

export const resolveUploadedAvatar = (response) => {
  const avatar = response?.avatar ? cacheBust(response.avatar) : null;
  return avatar ?? null;
};
