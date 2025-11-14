import { useEffect, useMemo, useRef } from "react";
import {
  abortFallbackRequest,
  createAvatarImageLoadHandler,
} from "./avatarImageLoaderHelpers.js";

const useAvatarImageLoader = ({
  source,
  viewportSize,
  setNaturalSize,
  recenterViewport,
  shouldRecenterRef,
}) => {
  const fallbackSizeControllerRef = useRef(null);
  const latestSourceRef = useRef(source);

  const handleImageLoad = useMemo(
    () =>
      createAvatarImageLoadHandler({
        source,
        viewportSize,
        fallbackSizeControllerRef,
        latestSourceRef,
        setNaturalSize,
        shouldRecenterRef,
        recenterViewport,
      }),
    [recenterViewport, setNaturalSize, shouldRecenterRef, source, viewportSize],
  );

  useEffect(() => {
    latestSourceRef.current = source;
    return () => abortFallbackRequest({ fallbackSizeControllerRef });
  }, [source]);

  return { handleImageLoad };
};

export default useAvatarImageLoader;
