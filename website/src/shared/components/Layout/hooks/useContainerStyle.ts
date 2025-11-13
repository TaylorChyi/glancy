import { CSSProperties, useMemo } from "react";

type UseContainerStyleParams = {
  shouldRenderDocker: boolean;
  dockerHeight: number;
  isMobile: boolean;
  sidebarWidth: number | null;
};

export const useContainerStyle = ({
  shouldRenderDocker,
  dockerHeight,
  isMobile,
  sidebarWidth,
}: UseContainerStyleParams): CSSProperties =>
  useMemo(() => {
    const resolvedDockerHeight = shouldRenderDocker ? dockerHeight : 0;
    const style: CSSProperties = { "--docker-h": `${resolvedDockerHeight}px` };
    if (!isMobile && typeof sidebarWidth === "number") {
      style["--sidebar-w"] = `${Math.round(sidebarWidth)}px`;
    }
    return style;
  }, [dockerHeight, isMobile, sidebarWidth, shouldRenderDocker]);
