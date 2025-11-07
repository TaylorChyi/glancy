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
