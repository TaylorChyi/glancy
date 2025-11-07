import { useCallback } from "react";
import renderCroppedAvatar from "./avatarCropRenderer.js";
import resolveCropParameters from "./cropParameterResolver.js";

const useAvatarCropper = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
  onConfirm,
}) => {
  const buildCropParameters = useCallback(
    () =>
      resolveCropParameters({
        imageRef,
        displayMetrics,
        viewportSize,
        naturalSize,
        offset,
      }),
    [displayMetrics, imageRef, naturalSize, offset, viewportSize],
  );

  const handleConfirm = useCallback(async () => {
    try {
      const parameters = buildCropParameters();
      if (!parameters) {
        return;
      }
      const result = await renderCroppedAvatar(parameters);
      await onConfirm(result);
    } catch (error) {
      console.error(error);
    }
  }, [buildCropParameters, onConfirm]);

  return { handleConfirm };
};

export default useAvatarCropper;
