/**
 * 背景：
 *  - 更换头像入口散落在 Profile 页面与偏好设置模块，缺乏统一的上传策略，导致重复逻辑与状态管理困难。
 * 目的：
 *  - 抽象为可复用的头像上传 Hook，通过统一的命令式接口协调文件选择、接口调用与用户态更新。
 * 关键决策与取舍：
 *  - 采用命令模式：向外暴露 onSelectAvatar 作为单一入口命令，内部封装上传流程，便于未来接入不同存储后端；
 *  - 提供状态机（idle/uploading/succeeded/failed）而非简单布尔值，兼顾后续提示与按钮节流需求；
 *  - 拒绝在 Hook 内直接触发提示组件，改由调用方根据状态自行处理，保持表现层可插拔。
 * 影响范围：
 *  - 偏好设置与其他头像入口可共享上传流程，用户 Store 在上传成功后立即同步最新头像。
 * 演进与TODO：
 *  - TODO: 后续可在 onSuccess/onError 中注入全局提示，或在状态机上扩展重试与进度反馈。
 */
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
