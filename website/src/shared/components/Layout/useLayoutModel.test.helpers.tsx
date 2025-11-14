import React from "react";
import { jest } from "@jest/globals";
import type { MutableRefObject } from "react";
import type {
  DockerViewProps,
  MainViewProps,
  ResizerViewProps,
  SidebarViewProps,
} from "./types.js";

export const createDivRef = (): MutableRefObject<HTMLDivElement | null> =>
  ({
    current: document.createElement("div"),
  }) as MutableRefObject<HTMLDivElement | null>;

export const createElementRef = (): MutableRefObject<HTMLElement | null> =>
  ({
    current: document.createElement("section"),
  }) as MutableRefObject<HTMLElement | null>;

export type DockerModel = { docker: DockerViewProps; dockerHeight: number };
export type SidebarModel = {
  sidebar: SidebarViewProps;
  resizer: ResizerViewProps;
  sidebarWidth: number | null;
  onToggleSidebar: () => void;
};
export type MainModel = { main: MainViewProps };

export type LayoutScenarioOptions = {
  isMobile?: boolean;
  children?: React.ReactNode;
  bottomContent?: React.ReactNode;
  sidebarProps?: Record<string, unknown>;
  onMainMiddleScroll?: () => void;
  dockerModel?: DockerModel;
  sidebarModel?: SidebarModel;
  mainModel?: MainModel;
  containerStyle?: Record<string, string>;
};

export const createDockerModel = ({
  shouldRender = false,
  content = null,
  dockerHeight = 0,
}: {
  shouldRender?: boolean;
  content?: React.ReactNode;
  dockerHeight?: number;
} = {}): DockerModel => ({
  docker: {
    shouldRender,
    dockerRef: createDivRef(),
    content,
  },
  dockerHeight,
});

export const createSidebarModel = ({
  props = {},
  sidebarWidth = null,
  visibleResizer = false,
  onToggleSidebar = jest.fn(),
}: {
  props?: SidebarViewProps["props"];
  sidebarWidth?: number | null;
  visibleResizer?: boolean;
  onToggleSidebar?: () => void;
} = {}): SidebarModel => ({
  sidebar: {
    ref: createDivRef(),
    props,
  },
  resizer: {
    visible: visibleResizer,
    onPointerDown: jest.fn(),
  },
  sidebarWidth,
  onToggleSidebar,
});

export const createMainModel = ({
  isMobile = false,
  children = null,
  onToggleSidebar = jest.fn(),
  overrides = {},
}: {
  isMobile?: boolean;
  children?: React.ReactNode;
  onToggleSidebar?: () => void;
  overrides?: Partial<MainViewProps>;
} = {}): MainModel => ({
  main: {
    isMobile,
    onToggleSidebar,
    contentRef: createElementRef(),
    children,
    ...overrides,
  },
});
