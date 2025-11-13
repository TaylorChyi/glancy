import { MutableRefObject, useEffect, useRef, useState } from "react";

type UseDockerMeasurementsParams = {
  shouldRenderDocker: boolean;
};

type UseDockerMeasurementsResult = {
  dockerRef: MutableRefObject<HTMLDivElement | null>;
  dockerHeight: number;
};

export const useDockerMeasurements = ({
  shouldRenderDocker,
}: UseDockerMeasurementsParams): UseDockerMeasurementsResult => {
  const dockerRef = useRef<HTMLDivElement | null>(null);
  const [dockerHeight, setDockerHeight] = useState(0);

  useEffect(() => {
    if (!shouldRenderDocker) {
      setDockerHeight((prev) => (prev === 0 ? prev : 0));
      return;
    }
    const node = dockerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      if (!entry) return;
      const nextHeight = Math.round(entry.contentRect.height);
      setDockerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setDockerHeight((prev) => (prev === 0 ? prev : 0));
    };
  }, [shouldRenderDocker]);

  return { dockerRef, dockerHeight };
};
