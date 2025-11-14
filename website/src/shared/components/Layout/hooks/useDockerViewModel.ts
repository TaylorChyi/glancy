import { ReactNode, useMemo } from "react";
import { useDockerMeasurements } from "./useDockerMeasurements.js";
import type { DockerViewProps } from "../types.js";

type UseDockerViewModelParams = {
  bottomContent: ReactNode;
  shouldRenderDocker: boolean;
};

type UseDockerViewModelResult = {
  docker: DockerViewProps;
  dockerHeight: number;
};

export const useDockerViewModel = ({
  bottomContent,
  shouldRenderDocker,
}: UseDockerViewModelParams): UseDockerViewModelResult => {
  const { dockerRef, dockerHeight } = useDockerMeasurements({ shouldRenderDocker });
  const docker = useMemo(
    (): DockerViewProps => ({
      shouldRender: shouldRenderDocker,
      dockerRef,
      content: bottomContent,
    }),
    [bottomContent, dockerRef, shouldRenderDocker],
  );
  return { docker, dockerHeight };
};
