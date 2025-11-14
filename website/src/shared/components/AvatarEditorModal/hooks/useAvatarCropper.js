import { useCallback } from "react";
import renderCroppedAvatar from "./avatarCropRenderer.js";
import resolveCropParameters from "./cropParameterResolver.js";

const buildResolverOptions = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) => ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
});

const createParameterBuilder = (options) => () => resolveCropParameters(options);

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

const createConfirmHandler = ({ buildCropParameters, onConfirm }) =>
  async () => {
    try {
      await executeCrop({ buildCropParameters, onConfirm });
    } catch (error) {
      handleCropError(error);
    }
  };

const useAvatarCropper = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
  onConfirm,
}) => {
  const buildCropParameters = useCallback(
    createParameterBuilder(
      buildResolverOptions({
        imageRef,
        displayMetrics,
        viewportSize,
        naturalSize,
        offset,
      }),
    ),
    [displayMetrics, imageRef, naturalSize, offset, viewportSize],
  );

  const handleConfirm = useCallback(
    createConfirmHandler({ buildCropParameters, onConfirm }),
    [buildCropParameters, onConfirm],
  );

  return { handleConfirm };
};

export default useAvatarCropper;
