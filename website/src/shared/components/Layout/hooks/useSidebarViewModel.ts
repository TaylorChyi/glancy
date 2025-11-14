import { MutableRefObject, useMemo } from "react";
import { useSidebarResizer } from "./useSidebarResizer.js";
import { useSidebarController } from "./useSidebarController.js";
import type {
  ResizerViewProps,
  SidebarViewProps,
} from "../types.js";

type UseSidebarViewModelParams = {
  isMobile: boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  sidebarProps: Record<string, unknown>;
};

type UseSidebarViewModelResult = {
  sidebar: SidebarViewProps;
  resizer: ResizerViewProps;
  sidebarWidth: number | null;
  onToggleSidebar: () => void;
};

export const useSidebarViewModel = ({
  isMobile,
  containerRef,
  sidebarProps,
}: UseSidebarViewModelParams): UseSidebarViewModelResult => {
  const { sidebarRef, sidebarWidth, handlePointerDown } = useSidebarResizer({
    isMobile,
    containerRef,
  });
  const { openSidebar, mergedSidebarProps } = useSidebarController({
    sidebarProps,
    isMobile,
  });
  const sidebar = useMemo(
    (): SidebarViewProps => ({
      ref: sidebarRef,
      props: mergedSidebarProps,
    }),
    [mergedSidebarProps, sidebarRef],
  );
  const resizer = useMemo(
    (): ResizerViewProps => ({
      visible: !isMobile,
      onPointerDown: handlePointerDown,
    }),
    [handlePointerDown, isMobile],
  );
  return { sidebar, resizer, sidebarWidth, onToggleSidebar: openSidebar };
};
