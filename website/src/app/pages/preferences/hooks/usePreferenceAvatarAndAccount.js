/**
 * 背景：
 *  - 头像上传与账户字段组装紧密耦合在主 Hook 中，既影响可读性也难以测试。
 * 目的：
 *  - 抽离账户区装配逻辑，组合头像体验与账户模型，向上暴露最小必要接口。
 * 关键决策与取舍：
 *  - 统一在此处记录上传异常，避免多处重复 console；
 *  - 依赖 useAccountSectionModel 生成视图模型，保持与历史行为一致。
 * 影响范围：
 *  - 偏好设置页面账户分区。
 * 演进与TODO：
 *  - 后续可引入埋点上报上传失败原因，支持更细粒度的监控。
 */
import { useCallback } from "react";
import { useAccountSectionModel } from "./useAccountSectionModel.js";
import { useAvatarEditorExperience } from "./useAvatarEditorExperience.js";

export const usePreferenceAvatarAndAccount = ({
  translations,
  preferenceCopy,
  emailBinding,
  updateUsernameRequest,
  user,
  setUser,
}) => {
  const handleAvatarUploadError = useCallback((error) => {
    console.error("Failed to upload avatar from preferences", error);
  }, []);

  const { avatarEditorModalProps, isAvatarUploading, handleAvatarSelection } =
    useAvatarEditorExperience({
      translations,
      onError: handleAvatarUploadError,
    });

  const accountModel = useAccountSectionModel({
    translations,
    fallbackValue: preferenceCopy.fallbackValue,
    accountCopy: preferenceCopy.account,
    emailBinding,
    onAvatarSelection: handleAvatarSelection,
    isAvatarUploading,
    updateUsernameRequest,
    setUser,
    user,
  });

  return { accountModel, avatarEditorModalProps };
};
