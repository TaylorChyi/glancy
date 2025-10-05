/**
 * 背景：
 *  - 头像更换流程此前直接在文件选择后触发上传，用户缺乏对裁剪与方向的掌控，容易产生错误头像。
 * 目的：
 *  - 通过组合裁剪模态与上传策略，为头像更新提供统一的编排接口，确保页面与模态场景复用一致体验。
 * 关键决策与取舍：
 *  - 采用外观模式：对外仅暴露 identity 与 overlays，内部协调裁剪模态与上传钩子，减少调用方耦合；
 *  - 状态机拆分 idle/editing/processing，保证裁剪、导出与上传的节奏清晰；
 *  - 在 Hook 内托管对象 URL 生命周期，避免调用方重复管理资源释放。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的头像更新体验。
 * 演进与TODO：
 *  - TODO: 后续可在 processing 态中接入进度反馈或失败提示策略。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AvatarCropperModal from "@/components/modals/AvatarCropperModal.jsx";
import useAvatarUploader from "./useAvatarUploader.js";

const CROP_PHASE = Object.freeze({
  idle: "idle",
  editing: "editing",
  processing: "processing",
});

const normalizeFiles = (filesLike) => {
  if (!filesLike) {
    return [];
  }
  if (typeof filesLike[Symbol.iterator] === "function") {
    return Array.from(filesLike);
  }
  if (typeof filesLike.length === "number") {
    return Array.from({ length: filesLike.length }, (_, index) => filesLike[index]);
  }
  return Array.isArray(filesLike) ? filesLike : [filesLike];
};

const defaultCopy = Object.freeze({
  title: "Adjust avatar",
  subtitle: "Drag to reframe the square and align your portrait.",
  orientation: "Rotate to match the expected orientation.",
  cancel: "Cancel",
  confirm: "Confirm",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  rotateLeft: "Rotate left",
  rotateRight: "Rotate right",
  zoomLabel: "Zoom", // 用于无障碍 aria-label
  rotationLabel: "Rotation", // 用于无障碍 aria-label
  previewAlt: "Avatar preview",
  helper: "Drag, zoom, or rotate until the circle frames your face.",
});

function deriveCopy(overrides = {}) {
  return { ...defaultCopy, ...overrides };
}

function stripExtension(name) {
  if (typeof name !== "string") {
    return "avatar";
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return "avatar";
  }
  const lastDotIndex = trimmed.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, lastDotIndex);
}

function useAvatarChangeFlow({ copy: copyOverrides, onUploadSuccess, onUploadError } = {}) {
  const uploader = useAvatarUploader({ onSuccess: onUploadSuccess, onError: onUploadError });
  const [state, setState] = useState({
    phase: CROP_PHASE.idle,
    objectUrl: null,
    fileName: "",
  });
  const latestObjectUrlRef = useRef(null);

  const copy = useMemo(() => deriveCopy(copyOverrides), [copyOverrides]);

  const releaseObjectUrl = useCallback((url) => {
    if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(url);
    }
  }, []);

  const resetState = useCallback(() => {
    setState({ phase: CROP_PHASE.idle, objectUrl: null, fileName: "" });
  }, []);

  useEffect(() => {
    return () => {
      releaseObjectUrl(latestObjectUrlRef.current);
    };
  }, [releaseObjectUrl]);

  const openCropper = useCallback(
    (filesLike) => {
      const [file] = normalizeFiles(filesLike).filter(Boolean);
      if (!file) {
        return false;
      }
      if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
        return false;
      }
      const nextUrl = URL.createObjectURL(file);
      releaseObjectUrl(latestObjectUrlRef.current);
      latestObjectUrlRef.current = nextUrl;
      setState({
        phase: CROP_PHASE.editing,
        objectUrl: nextUrl,
        fileName: stripExtension(file.name),
      });
      return true;
    },
    [releaseObjectUrl],
  );

  const handleCancel = useCallback(() => {
    releaseObjectUrl(latestObjectUrlRef.current);
    latestObjectUrlRef.current = null;
    resetState();
  }, [releaseObjectUrl, resetState]);

  const handleConfirm = useCallback(
    async (file) => {
      if (!file) {
        return false;
      }
      setState((previous) => ({ ...previous, phase: CROP_PHASE.processing }));
      const succeeded = await uploader.onSelectAvatar([file]);
      if (succeeded) {
        handleCancel();
      } else {
        setState((previous) => ({ ...previous, phase: CROP_PHASE.editing }));
      }
      return succeeded;
    },
    [handleCancel, uploader],
  );

  const overlays = useMemo(() => {
    if (state.phase === CROP_PHASE.idle) {
      return [];
    }
    return [
      <AvatarCropperModal
        key="avatar-cropper-modal"
        open={state.phase !== CROP_PHASE.idle}
        source={state.objectUrl}
        fileName={state.fileName}
        copy={copy}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        processing={
          state.phase === CROP_PHASE.processing || uploader.isUploading
        }
      />,
    ];
  }, [copy, handleCancel, handleConfirm, state.objectUrl, state.phase, state.fileName, uploader.isUploading]);

  const identity = useMemo(
    () => ({
      onSelectAvatar: openCropper,
      isUploading: uploader.isUploading,
    }),
    [openCropper, uploader.isUploading],
  );

  return {
    identity,
    overlays,
    status: uploader.status,
    error: uploader.error,
    reset: uploader.reset,
  };
}

export default useAvatarChangeFlow;
