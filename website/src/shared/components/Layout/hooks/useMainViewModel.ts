import { ReactNode, useMemo } from "react";
import { useMainScrollRef } from "./useMainScrollRef.js";
import type { MainViewProps } from "../types.js";

type UseMainViewModelParams = {
  isMobile: boolean;
  children: ReactNode;
  onToggleSidebar: () => void;
  onMainMiddleScroll?: (event: Event) => void;
};

type UseMainViewModelResult = {
  main: MainViewProps;
};

export const useMainViewModel = ({
  isMobile,
  children,
  onToggleSidebar,
  onMainMiddleScroll,
}: UseMainViewModelParams): UseMainViewModelResult => {
  const contentRef = useMainScrollRef({ onScroll: onMainMiddleScroll });
  const main = useMemo(
    (): MainViewProps => ({
      isMobile,
      onToggleSidebar,
      contentRef,
      children,
    }),
    [children, contentRef, isMobile, onToggleSidebar],
  );
  return { main };
};
