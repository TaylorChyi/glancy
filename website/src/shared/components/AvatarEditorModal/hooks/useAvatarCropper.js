import { useCallback, useMemo } from "react";
import renderCroppedAvatar from "./avatarCropRenderer.js";
import resolveCropParameters from "./cropParameterResolver.js";

const createCropParametersBuilder = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) => () =>
  resolveCropParameters({
    imageRef,
    displayMetrics,
    viewportSize,
    naturalSize,
    offset,
  });

const executeCrop = async ({ buildCropParameters, onConfirm }) => {
  const parameters = buildCropParameters();
  if (!parameters) {
    return;
  }
  const result = await renderCroppedAvatar(parameters);
  await onConfirm(result);
};

const handleCropError = (error) => {
  console.error(error);
};

const useAvatarCropper = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
  onConfirm,
}) => {
  const buildCropParameters = useMemo(
    () =>
      createCropParametersBuilder({
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
      await executeCrop({ buildCropParameters, onConfirm });
    } catch (error) {
      handleCropError(error);
    }
  }, [buildCropParameters, onConfirm]);

  return { handleConfirm };
};

export default useAvatarCropper;
