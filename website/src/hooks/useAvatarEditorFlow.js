/**
 * 背景：
 *  - 头像上传流程此前直接依赖文件 input，缺少统一的预览与裁剪体验，用户无法校准方向与构图。
 * 目的：
 *  - 通过状态化 Hook 管理文件归一化、裁剪弹窗的显隐与上传命令，协调页面与模态的复用需求。
 * 关键决策与取舍：
 *  - 采用状态机 + 命令模式：Hook 内部维护 idle/loading/ready/processing/failed 五态，并向外暴露命令式 confirm/cancel 接口；拒绝在 Hook 中渲染 UI，保持表现层可插拔。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 可通过同一 Hook 获取裁剪弹窗所需的上下文与动作。
 *  演进与TODO：
 *  - TODO: 后续可在状态机上扩展进度反馈或历史记录（例如最近使用的头像）。
 */
import { useCallback, useMemo, useRef, useState } from "react";
import useAvatarUploader, {
  AVATAR_UPLOAD_STATUS,
} from "./useAvatarUploader.js";
import { normalizeFiles, normalizeImageOrientation } from "@/utils";

export const AVATAR_EDITOR_STATUS = Object.freeze({
  idle: "idle",
  loading: "loading",
  ready: "ready",
  processing: "processing",
  failed: "failed",
});

const INITIAL_STATE = Object.freeze({
  status: AVATAR_EDITOR_STATUS.idle,
  previewUrl: "",
  imageWidth: 0,
  imageHeight: 0,
  mimeType: "image/png",
  error: null,
});

const deriveExtension = (mimeType) => {
  switch ((mimeType || "").toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return ".png";
  }
};

const sanitizeBaseName = (fileName) => {
  if (typeof fileName !== "string" || fileName.trim().length === 0) {
    return "avatar";
  }
  const withoutExt = fileName.replace(/\.[^.]+$/, "").trim();
  const normalized = withoutExt.replace(/[^a-z0-9-_]+/gi, "-");
  if (normalized.length === 0) {
    return "avatar";
  }
  return normalized.slice(0, 60);
};

export default function useAvatarEditorFlow() {
  const uploader = useAvatarUploader();
  const [state, setState] = useState(INITIAL_STATE);
  const originalNameRef = useRef("avatar");
  const previewUrlRef = useRef("");

  const cleanupPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, []);

  const resetEditor = useCallback(() => {
    cleanupPreviewUrl();
    setState(INITIAL_STATE);
  }, [cleanupPreviewUrl]);

  const handleCancel = useCallback(() => {
    resetEditor();
    if (typeof uploader.reset === "function") {
      uploader.reset();
    }
  }, [resetEditor, uploader]);

  const handleSourceSelect = useCallback(
    async (candidates) => {
      const [file] = normalizeFiles(candidates);
      if (!file) {
        return false;
      }
      cleanupPreviewUrl();
      originalNameRef.current = file.name || "avatar";
      setState({
        status: AVATAR_EDITOR_STATUS.loading,
        previewUrl: "",
        imageWidth: 0,
        imageHeight: 0,
        mimeType: file.type || "image/png",
        error: null,
      });

      try {
        const { blob, width, height } = await normalizeImageOrientation(file);
        const previewBlob = blob instanceof Blob ? blob : file;
        const previewUrl = URL.createObjectURL(previewBlob);
        previewUrlRef.current = previewUrl;
        setState({
          status: AVATAR_EDITOR_STATUS.ready,
          previewUrl,
          imageWidth: width || previewBlob.width || 0,
          imageHeight: height || previewBlob.height || 0,
          mimeType: previewBlob.type || file.type || "image/png",
          error: null,
        });
        return true;
      } catch (error) {
        setState({
          status: AVATAR_EDITOR_STATUS.failed,
          previewUrl: "",
          imageWidth: 0,
          imageHeight: 0,
          mimeType: file.type || "image/png",
          error,
        });
        return false;
      }
    },
    [cleanupPreviewUrl],
  );

  const handleConfirm = useCallback(
    async (blob) => {
      if (!(blob instanceof Blob)) {
        return false;
      }

      setState((previous) => ({
        ...previous,
        status: AVATAR_EDITOR_STATUS.processing,
        error: null,
      }));

      const mimeType = blob.type && blob.type.startsWith("image/") ? blob.type : state.mimeType;
      const extension = deriveExtension(mimeType);
      const fileName = `${sanitizeBaseName(originalNameRef.current)}${extension}`;
      const file = new File([blob], fileName, { type: mimeType });

      try {
        const didUpload = await uploader.onSelectAvatar([file]);
        if (didUpload) {
          resetEditor();
          if (typeof uploader.reset === "function") {
            uploader.reset();
          }
          return true;
        }
        setState((previous) => ({
          ...previous,
          status: AVATAR_EDITOR_STATUS.failed,
          error:
            uploader.error ||
            new Error("avatar-editor-upload-failed"),
        }));
        return false;
      } catch (error) {
        setState((previous) => ({
          ...previous,
          status: AVATAR_EDITOR_STATUS.failed,
          error,
        }));
        return false;
      }
    },
    [resetEditor, state.mimeType, uploader],
  );

  const effectiveError = useMemo(() => state.error || uploader.error || null, [state.error, uploader.error]);
  const isProcessing = useMemo(
    () =>
      state.status === AVATAR_EDITOR_STATUS.processing ||
      uploader.status === AVATAR_UPLOAD_STATUS.uploading ||
      uploader.isUploading,
    [state.status, uploader.isUploading, uploader.status],
  );

  const avatarEditor = useMemo(
    () => ({
      open: state.status !== AVATAR_EDITOR_STATUS.idle,
      status: state.status,
      imageUrl: state.previewUrl,
      imageWidth: state.imageWidth,
      imageHeight: state.imageHeight,
      fileName: originalNameRef.current,
      mimeType: state.mimeType,
      error: effectiveError,
      isPreparing: state.status === AVATAR_EDITOR_STATUS.loading,
      isProcessing,
      handleCancel,
      handleConfirm,
    }),
    [
      effectiveError,
      handleCancel,
      handleConfirm,
      isProcessing,
      state.imageHeight,
      state.imageWidth,
      state.mimeType,
      state.previewUrl,
      state.status,
    ],
  );

  const isBusy = useMemo(
    () =>
      state.status === AVATAR_EDITOR_STATUS.loading ||
      state.status === AVATAR_EDITOR_STATUS.processing ||
      uploader.status === AVATAR_UPLOAD_STATUS.uploading,
    [state.status, uploader.status],
  );

  return {
    onSelectAvatar: handleSourceSelect,
    avatarEditor,
    isBusy,
  };
}
