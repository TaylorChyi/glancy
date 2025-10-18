/**
 * 背景：
 *  - usePreferenceSections 需要装配头像编辑体验，但主 Hook 不宜直接依赖工作流细节。
 * 目的：
 *  - 暴露一个面向偏好设置的 Facade，提供头像选择回调与模态属性。
 * 关键决策与取舍：
 *  - 复用共享层的 useAvatarEditorWorkflow，同时在此处集中注入文案与错误处理。
 *  - 通过 useMemo 缓存标签生成，避免在高频渲染中重复计算。
 * 影响范围：
 *  - 偏好设置页面与其他可能复用该体验的设置类入口。
 * 演进与TODO：
 *  - 后续可根据设备类型扩展 uploaderOptions（例如移动端拍照支持）。
 */
import { useMemo } from "react";
import useAvatarEditorWorkflow from "@shared/hooks/useAvatarEditorWorkflow.js";
import { createAvatarEditorLabels } from "./createAvatarEditorLabels.js";

export const useAvatarEditorExperience = ({ translations, onError }) => {
  const labels = useMemo(() => createAvatarEditorLabels(translations), [translations]);

  const { selectAvatar, modalProps, isBusy } = useAvatarEditorWorkflow({
    labels,
    uploaderOptions: { onError },
  });

  return {
    handleAvatarSelection: selectAvatar,
    avatarEditorModalProps: modalProps,
    isAvatarUploading: isBusy,
  };
};
