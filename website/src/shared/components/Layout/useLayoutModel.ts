import {
  CSSProperties,
  MutableRefObject,
  ReactNode,
  useRef,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useIsMobile } from "@shared/utils/device.js";
import { useSidebarResizer } from "./hooks/useSidebarResizer.js";
import { useMainScrollRef } from "./hooks/useMainScrollRef.js";
import { useDockerMeasurements } from "./hooks/useDockerMeasurements.js";
import { useSidebarController } from "./hooks/useSidebarController.js";
import { useContainerStyle } from "./hooks/useContainerStyle.js";

type LayoutModelInput = {
  children: ReactNode;
  sidebarProps?: Record<string, unknown>;
  bottomContent?: ReactNode;
  onMainMiddleScroll?: (event: Event) => void;
};

type SidebarViewProps = {
  ref: MutableRefObject<HTMLDivElement | null>;
  props: Record<string, unknown>;
};

type ResizerViewProps = {
  visible: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

type MainViewProps = {
  isMobile: boolean;
  onToggleSidebar: () => void;
  contentRef: MutableRefObject<HTMLElement | null>;
  children: ReactNode;
};

type DockerViewProps = {
  shouldRender: boolean;
  dockerRef: MutableRefObject<HTMLDivElement | null>;
  content: ReactNode;
};

export type LayoutViewModel = {
  viewProps: {
    containerRef: MutableRefObject<HTMLDivElement | null>;
    containerStyle: CSSProperties;
    sidebar: SidebarViewProps;
    resizer: ResizerViewProps;
    main: MainViewProps;
    docker: DockerViewProps;
  };
};

export const useLayoutModel = ({
  children,
  sidebarProps = {},
  bottomContent = null,
  onMainMiddleScroll,
}: LayoutModelInput): LayoutViewModel => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldRenderDocker = Boolean(bottomContent);

  const { sidebarRef, sidebarWidth, handlePointerDown } = useSidebarResizer({
    isMobile,
    containerRef,
  });

  const { openSidebar, mergedSidebarProps } = useSidebarController({
    sidebarProps,
    isMobile,
  });

  const contentRef = useMainScrollRef({ onScroll: onMainMiddleScroll });

  const { dockerRef, dockerHeight } = useDockerMeasurements({
    shouldRenderDocker,
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
      sidebar: {
        ref: sidebarRef,
        props: mergedSidebarProps,
      },
      resizer: {
        visible: !isMobile,
        onPointerDown: handlePointerDown,
      },
      main: {
        isMobile,
        onToggleSidebar: openSidebar,
        contentRef,
        children,
      },
      docker: {
        shouldRender: shouldRenderDocker,
        dockerRef,
        content: bottomContent,
      },
    },
  };
};

export default useLayoutModel;
