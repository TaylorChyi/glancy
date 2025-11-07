import { useMemo } from "react";
import useAvatarEditorWorkflow from "@shared/hooks/useAvatarEditorWorkflow.js";
import { createAvatarEditorLabels } from "./createAvatarEditorLabels.js";

export const useAvatarEditorExperience = ({ translations, onError }) => {
  const labels = useMemo(
    () => createAvatarEditorLabels(translations),
    [translations],
  );

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
