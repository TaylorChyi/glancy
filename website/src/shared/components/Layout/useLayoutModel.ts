import { ReactNode } from "react";
import { useIsMobile } from "@shared/utils/device.js";
import { useContainerStyle } from "./hooks/useContainerStyle.js";
import { useDockerViewModel } from "./hooks/useDockerViewModel.js";
import { useLayoutContainerRef } from "./hooks/useLayoutContainerRef.js";
import { useMainViewModel } from "./hooks/useMainViewModel.js";
import { useSidebarViewModel } from "./hooks/useSidebarViewModel.js";
import type { LayoutViewModel } from "./types.js";

type LayoutModelInput = {
  children: ReactNode;
  sidebarProps?: Record<string, unknown>;
  bottomContent?: ReactNode;
  onMainMiddleScroll?: (event: Event) => void;
};

export const useLayoutModel = ({
  children,
  sidebarProps = {},
  bottomContent = null,
  onMainMiddleScroll,
}: LayoutModelInput): LayoutViewModel => {
  const isMobile = useIsMobile();
  const shouldRenderDocker = Boolean(bottomContent);
  const containerRef = useLayoutContainerRef();

  const { docker, dockerHeight } = useDockerViewModel({
    bottomContent,
    shouldRenderDocker,
  });

  const { sidebar, resizer, sidebarWidth, onToggleSidebar } = useSidebarViewModel({
    isMobile,
    containerRef,
    sidebarProps,
  });

  const { main } = useMainViewModel({
    isMobile,
    children,
    onToggleSidebar,
    onMainMiddleScroll,
  });

  const containerStyle = useContainerStyle({
    shouldRenderDocker,
    dockerHeight,
    isMobile,
    sidebarWidth,
  });

  return {
    viewProps: {
      containerRef,
      containerStyle,
      sidebar,
      resizer,
      main,
      docker,
    },
  };
};

export type { LayoutViewModel } from "./types.js";
export default useLayoutModel;
