import { useCallback, useMemo, useState } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import { useUser } from "@core/context";
import { cacheBust } from "@shared/utils";

export const AVATAR_UPLOAD_STATUS = Object.freeze({
  idle: "idle",
  uploading: "uploading",
  succeeded: "succeeded",
  failed: "failed",
});

const normalizeFiles = (files) => {
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

/**
 * 意图：统一处理头像文件上传并在成功后刷新用户上下文。
 * 输入：
 *  - options.onSuccess?: 上传成功后的回调；
 *  - options.onError?: 上传失败后的回调；
 * 输出：
 *  - 状态机对象（status/error/isUploading）与 onSelectAvatar 命令。
 * 流程：
 *  1) 解析文件列表并筛选首个有效文件；
 *  2) 校验用户上下文后调用上传接口；
 *  3) 成功时刷新用户头像、更新状态机，失败时记录错误并回调。
 * 错误处理：缺失文件或用户信息时直接失败并生成语义化错误码。
 * 复杂度：O(1) —— 仅对有限文件列表与常量状态进行操作。
 */
export default function useAvatarUploader({ onSuccess, onError } = {}) {
  const api = useApi();
  const { users } = api ?? {};
  const userStore = useUser();
  const { user, setUser } = userStore ?? {};
  const [status, setStatus] = useState(AVATAR_UPLOAD_STATUS.idle);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStatus(AVATAR_UPLOAD_STATUS.idle);
    setError(null);
  }, []);

  const onSelectAvatar = useCallback(
    async (filesLike) => {
      const [file] = normalizeFiles(filesLike).filter(Boolean);
      if (!file) {
        return false;
      }

      if (!user || !user.id || !user.token) {
        const missingUserError = new Error("avatar-upload-missing-user");
        missingUserError.code = "avatar-upload-missing-user";
        setStatus(AVATAR_UPLOAD_STATUS.failed);
        setError(missingUserError);
        if (typeof onError === "function") {
          onError(missingUserError);
        }
        return false;
      }

      setStatus(AVATAR_UPLOAD_STATUS.uploading);
      setError(null);

      try {
        if (!users || typeof users.uploadAvatar !== "function") {
          throw new Error("avatar-upload-missing-client");
        }

        const response = await users.uploadAvatar({
          userId: user.id,
          token: user.token,
          file,
        });
        const nextAvatar = response?.avatar ? cacheBust(response.avatar) : null;
        if (nextAvatar && typeof setUser === "function") {
          setUser({ ...user, avatar: nextAvatar });
        }
        setStatus(AVATAR_UPLOAD_STATUS.succeeded);
        if (typeof onSuccess === "function") {
          onSuccess({ avatar: nextAvatar, response });
        }
        return true;
      } catch (uploadError) {
        setStatus(AVATAR_UPLOAD_STATUS.failed);
        setError(uploadError);
        if (typeof onError === "function") {
          onError(uploadError);
        }
        return false;
      }
    },
    [onError, onSuccess, setUser, user, users],
  );

  const state = useMemo(
    () => ({
      status,
      error,
      isUploading: status === AVATAR_UPLOAD_STATUS.uploading,
    }),
    [error, status],
  );

  return { ...state, onSelectAvatar, reset };
}
