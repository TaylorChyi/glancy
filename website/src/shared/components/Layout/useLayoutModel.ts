import { MutableRefObject, ReactNode } from "react";
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

type DockerModelInput = {
  bottomContent: ReactNode;
  shouldRenderDocker: boolean;
};

type SidebarModelInput = {
  isMobile: boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  sidebarProps: Record<string, unknown>;
};

type MainModelInput = {
  isMobile: boolean;
  children: ReactNode;
  onToggleSidebar: () => void;
  onMainMiddleScroll?: (event: Event) => void;
};

type ContainerStyleModelInput = {
  shouldRenderDocker: boolean;
  dockerHeight: number;
  isMobile: boolean;
  sidebarWidth: number | null;
};

export const useLayoutModel = ({
  children,
  sidebarProps = {},
  bottomContent = null,
  onMainMiddleScroll,
}: LayoutModelInput): LayoutViewModel => {
  const isMobile = useIsMobile();
  const containerRef = useLayoutContainerRef();
  const shouldRenderDocker = Boolean(bottomContent);
  const { docker, dockerHeight } = useDockerModel({ bottomContent, shouldRenderDocker });
  const { sidebar, resizer, sidebarWidth, onToggleSidebar } = useSidebarModel({
    isMobile,
    containerRef,
    sidebarProps,
  });
  const { main } = useMainModel({ isMobile, children, onToggleSidebar, onMainMiddleScroll });
  const containerStyle = useContainerStyleModel({ shouldRenderDocker, dockerHeight, isMobile, sidebarWidth });

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

const useDockerModel = ({
  bottomContent,
  shouldRenderDocker,
}: DockerModelInput) =>
  useDockerViewModel({
    bottomContent,
    shouldRenderDocker,
  });

const useSidebarModel = ({
  isMobile,
  containerRef,
  sidebarProps,
}: SidebarModelInput) =>
  useSidebarViewModel({
    isMobile,
    containerRef,
    sidebarProps,
  });

const useMainModel = ({
  isMobile,
  children,
  onToggleSidebar,
  onMainMiddleScroll,
}: MainModelInput) =>
  useMainViewModel({
    isMobile,
    children,
    onToggleSidebar,
    onMainMiddleScroll,
  });

const useContainerStyleModel = ({
  shouldRenderDocker,
  dockerHeight,
  isMobile,
  sidebarWidth,
}: ContainerStyleModelInput) =>
  useContainerStyle({
    shouldRenderDocker,
    dockerHeight,
    isMobile,
    sidebarWidth,
  });

export type { LayoutViewModel } from "./types.js";
export default useLayoutModel;
