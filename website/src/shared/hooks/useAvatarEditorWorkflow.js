import { useCallback, useEffect, useMemo, useReducer } from "react";
import useAvatarUploader from "./useAvatarUploader.js";
import {
  normalizeAvatarFileName,
  resolveAvatarFallbackName,
} from "@shared/utils/avatarFile.js";

const PHASES = Object.freeze({
  idle: "idle",
  preview: "preview",
  uploading: "uploading",
});

const ACTIONS = Object.freeze({
  open: "OPEN",
  startUpload: "START_UPLOAD",
  fail: "FAIL",
  complete: "COMPLETE",
  close: "CLOSE",
});

const DEFAULT_FILE_TYPE = "image/png";

function createInitialState() {
  return {
    phase: PHASES.idle,
    source: "",
    fileName: resolveAvatarFallbackName(),
    fileType: DEFAULT_FILE_TYPE,
  };
}

const reducerHandlers = {
  [ACTIONS.open]: (_, action) => ({
    phase: PHASES.preview,
    source: action.payload?.source ?? "",
    fileName: action.payload?.fileName || resolveAvatarFallbackName(),
    fileType: action.payload?.fileType || DEFAULT_FILE_TYPE,
  }),
  [ACTIONS.startUpload]: (state) =>
    state.phase === PHASES.idle
      ? state
      : { ...state, phase: PHASES.uploading },
  [ACTIONS.fail]: (state) => ({ ...state, phase: PHASES.preview }),
  [ACTIONS.complete]: () => createInitialState(),
  [ACTIONS.close]: () => createInitialState(),
};

function reducer(state, action) {
  const handler = reducerHandlers[action.type];
  return handler ? handler(state, action) : state;
}

function pickFirstFile(filesLike) {
  if (!filesLike) {
    return null;
  }
  if (typeof filesLike[Symbol.iterator] === "function") {
    for (const candidate of filesLike) {
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }
  if (typeof filesLike.length === "number") {
    for (let index = 0; index < filesLike.length; index += 1) {
      const candidate = filesLike[index];
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }
  return filesLike;
}

function revokeIfPresent(source) {
  if (source) {
    URL.revokeObjectURL(source);
  }
}

function useRevokeObjectUrl(source) {
  useEffect(() => () => revokeIfPresent(source), [source]);
}

function useSelectAvatar(dispatch) {
  return useCallback(
    (filesLike) => {
      const candidate = pickFirstFile(filesLike);
      if (!candidate) {
        return false;
      }
      const nextSource = URL.createObjectURL(candidate);
      dispatch({
        type: ACTIONS.open,
        payload: {
          source: nextSource,
          fileName: candidate.name,
          fileType: candidate.type,
        },
      });
      return true;
    },
    [dispatch],
  );
}

function useHandleCancel(dispatch, reset) {
  return useCallback(() => {
    dispatch({ type: ACTIONS.close });
    reset();
  }, [dispatch, reset]);
}

function useHandleConfirm({
  dispatch,
  reset,
  onSelectAvatar,
  fileName,
  fileType,
}) {
  return useCallback(
    async ({ blob, previewUrl }) => {
      if (!blob) {
        revokeIfPresent(previewUrl);
        return false;
      }

      dispatch({ type: ACTIONS.startUpload });
      const preferredType = blob.type || fileType || DEFAULT_FILE_TYPE;
      const normalizedName = normalizeAvatarFileName(
        fileName,
        preferredType,
      );
      const file = new File([blob], normalizedName, { type: preferredType });

      let success = false;
      try {
        success = await onSelectAvatar([file]);
      } finally {
        revokeIfPresent(previewUrl);
      }

      if (success) {
        dispatch({ type: ACTIONS.complete });
        reset();
        return true;
      }

      dispatch({ type: ACTIONS.fail });
      return false;
    },
    [dispatch, fileName, fileType, onSelectAvatar, reset],
  );
}

/**
 * 意图：协调头像裁剪模态与上传命令，输出可组合的控制接口。
 * 输入：
 *  - labels?: AvatarEditorModal 所需文案；
 *  - uploaderOptions?: 透传给 useAvatarUploader 的配置（onSuccess/onError 等）。
 * 输出：
 *  - selectAvatar: 触发裁剪模态的入口；
 *  - modalProps: AvatarEditorModal 所需属性集合；
 *  - isBusy: 当前是否处于上传中，用于禁用触发按钮。
 * 流程：
 *  1) selectAvatar 解析文件并生成预览 URL，切换到 preview 态；
 *  2) 用户确认后生成规范化文件名并调用上传命令；
 *  3) 上传成功关闭模态并复位状态，否则回退到预览态供重试。
 * 错误处理：
 *  - 上传失败保持模态开启，并依赖 useAvatarUploader 返回的错误处理回调。
 * 复杂度：
 *  - 时间：O(1)，仅处理单文件；空间：O(1)，仅存储当前文件状态。
 */
export default function useAvatarEditorWorkflow({ labels, uploaderOptions } = {}) {
  const { onSelectAvatar, isUploading, reset } = useAvatarUploader(uploaderOptions);
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  useRevokeObjectUrl(state.source);
  const selectAvatar = useSelectAvatar(dispatch);
  const handleCancel = useHandleCancel(dispatch, reset);
  const handleConfirm = useHandleConfirm({
    dispatch,
    reset,
    onSelectAvatar,
    fileName: state.fileName,
    fileType: state.fileType,
  });
  const isBusy = state.phase === PHASES.uploading || isUploading;
  const modalProps = useMemo(
    () => ({
      open: state.phase !== PHASES.idle,
      source: state.source,
      onCancel: handleCancel,
      onConfirm: handleConfirm,
      labels,
      isProcessing: isBusy,
    }),
    [handleCancel, handleConfirm, isBusy, labels, state.phase, state.source],
  );
  return { selectAvatar, modalProps, isBusy };
}
