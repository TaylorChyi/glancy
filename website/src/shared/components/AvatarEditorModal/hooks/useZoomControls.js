import { useCallback } from "react";
import { clampZoom } from "@shared/utils/avatarCropBox.js";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "../constants.js";

const useZoomControls = ({ zoom, setZoom, isProcessing }) => {
  const handleZoomIn = useCallback(() => {
    setZoom((previous) => clampZoom(previous + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((previous) => clampZoom(previous - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, [setZoom]);

  const isZoomInDisabled = zoom >= MAX_ZOOM || isProcessing;
  const isZoomOutDisabled = zoom <= MIN_ZOOM || isProcessing;

  return {
    handleZoomIn,
    handleZoomOut,
    isZoomInDisabled,
    isZoomOutDisabled,
  };
};

export default useZoomControls;
