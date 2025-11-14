/* eslint-env jest */
import React from "react";
import { jest } from "@jest/globals";
import type { MutableRefObject } from "react";
import {
  createDockerModel,
  createMainModel,
  createSidebarModel,
  type DockerModel,
  type LayoutScenarioOptions,
  type MainModel,
  type SidebarModel,
} from "./useLayoutModel.test.helpers.tsx";

export const expectViewProps = ({
  result,
  containerRef,
  containerStyle,
  sidebarModel,
  mainModel,
  dockerModel,
}: {
  result: { current: { viewProps: unknown } };
  containerRef: MutableRefObject<HTMLDivElement | null>;
  containerStyle: Record<string, string>;
  sidebarModel: SidebarModel;
  mainModel: MainModel;
  dockerModel: DockerModel;
}) => {
  expect(result.current.viewProps).toEqual({
    containerRef,
    containerStyle,
    sidebar: sidebarModel.sidebar,
    resizer: sidebarModel.resizer,
    main: mainModel.main,
    docker: dockerModel.docker,
  });
};

export function expectHookUsage({
  bottomContent,
  shouldRenderDocker,
  isMobile,
  containerRef,
  sidebarProps,
  children,
  onToggleSidebar,
  onMainMiddleScroll,
  dockerModel,
  sidebarModel,
  mocks,
}: {
  bottomContent: React.ReactNode;
  shouldRenderDocker: boolean;
  isMobile: boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  sidebarProps: Record<string, unknown>;
  children: React.ReactNode;
  onToggleSidebar: () => void;
  onMainMiddleScroll?: () => void;
  dockerModel: DockerModel;
  sidebarModel: SidebarModel;
  mocks: {
    useDockerViewModelMock: jest.Mock;
    useSidebarViewModelMock: jest.Mock;
    useMainViewModelMock: jest.Mock;
    useContainerStyleMock: jest.Mock;
  };
}): void {
  const { useDockerViewModelMock, useSidebarViewModelMock, useMainViewModelMock, useContainerStyleMock } =
    mocks;

  expect(useDockerViewModelMock).toHaveBeenCalledWith({
    bottomContent,
    shouldRenderDocker,
  });
  expect(useSidebarViewModelMock).toHaveBeenCalledWith({
    isMobile,
    containerRef,
    sidebarProps,
  });
  expect(useMainViewModelMock).toHaveBeenCalledWith({
    isMobile,
    children,
    onToggleSidebar,
    onMainMiddleScroll,
  });
  expect(useContainerStyleMock).toHaveBeenCalledWith({
    shouldRenderDocker,
    dockerHeight: dockerModel.dockerHeight,
    isMobile,
    sidebarWidth: sidebarModel.sidebarWidth,
  });
};

export function createComposedScenario({
  children,
  bottomContent,
  sidebarProps,
  onMainMiddleScroll,
  onToggleSidebar,
}: {
  children: React.ReactNode;
  bottomContent: React.ReactNode;
  sidebarProps: Record<string, unknown>;
  onMainMiddleScroll: () => void;
  onToggleSidebar: () => void;
}): LayoutScenarioOptions {
  return {
    isMobile: true,
    children,
    bottomContent,
    sidebarProps,
    onMainMiddleScroll,
    dockerModel: createDockerModel({
      shouldRender: true,
      content: bottomContent,
      dockerHeight: 96,
    }),
    sidebarModel: createSidebarModel({
      props: { role: "complementary" },
      sidebarWidth: 320,
      visibleResizer: true,
      onToggleSidebar,
    }),
    mainModel: createMainModel({
      isMobile: true,
      children,
      onToggleSidebar,
    }),
    containerStyle: { "--docker-h": "96px" },
  };
}

export const createFallbackScenario = ({
  children,
}: {
  children: React.ReactNode;
}): LayoutScenarioOptions => {
  const sidebarModel = createSidebarModel();

  return {
    children,
    dockerModel: createDockerModel(),
    sidebarModel,
    mainModel: createMainModel({
      isMobile: false,
      children,
      onToggleSidebar: sidebarModel.onToggleSidebar,
    }),
    containerStyle: { "--docker-h": "0px" },
  };
};
