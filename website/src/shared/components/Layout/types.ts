import { CSSProperties, MutableRefObject, ReactNode } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type SidebarViewProps = {
  ref: MutableRefObject<HTMLDivElement | null>;
  props: Record<string, unknown>;
};

export type ResizerViewProps = {
  visible: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export type MainViewProps = {
  isMobile: boolean;
  onToggleSidebar: () => void;
  contentRef: MutableRefObject<HTMLElement | null>;
  children: ReactNode;
};

export type DockerViewProps = {
  shouldRender: boolean;
  dockerRef: MutableRefObject<HTMLDivElement | null>;
  content: ReactNode;
};

export type LayoutViewProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  containerStyle: CSSProperties;
  sidebar: SidebarViewProps;
  resizer: ResizerViewProps;
  main: MainViewProps;
  docker: DockerViewProps;
};

export type LayoutViewModel = {
  viewProps: LayoutViewProps;
};
