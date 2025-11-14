/* eslint-env jest */

import React from "react";
import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import type { MutableRefObject } from "react";
import type {
  DockerViewProps,
  MainViewProps,
  ResizerViewProps,
  SidebarViewProps,
} from "./types.js";

const useIsMobileMock = jest.fn();
const useLayoutContainerRefMock = jest.fn();
const useDockerViewModelMock = jest.fn();
const useSidebarViewModelMock = jest.fn();
const useMainViewModelMock = jest.fn();
const useContainerStyleMock = jest.fn();

jest.unstable_mockModule("@shared/utils/device.js", () => ({
  __esModule: true,
  useIsMobile: useIsMobileMock,
}));

jest.unstable_mockModule("./hooks/useLayoutContainerRef.js", () => ({
  __esModule: true,
  useLayoutContainerRef: useLayoutContainerRefMock,
}));

jest.unstable_mockModule("./hooks/useDockerViewModel.js", () => ({
  __esModule: true,
  useDockerViewModel: useDockerViewModelMock,
}));

jest.unstable_mockModule("./hooks/useSidebarViewModel.js", () => ({
  __esModule: true,
  useSidebarViewModel: useSidebarViewModelMock,
}));

jest.unstable_mockModule("./hooks/useMainViewModel.js", () => ({
  __esModule: true,
  useMainViewModel: useMainViewModelMock,
}));

jest.unstable_mockModule("./hooks/useContainerStyle.js", () => ({
  __esModule: true,
  useContainerStyle: useContainerStyleMock,
}));

const { useLayoutModel } = await import("./useLayoutModel.ts");

const createDivRef = (): MutableRefObject<HTMLDivElement | null> =>
  ({
    current: document.createElement("div"),
  }) as MutableRefObject<HTMLDivElement | null>;

const createElementRef = (): MutableRefObject<HTMLElement | null> =>
  ({
    current: document.createElement("section"),
  }) as MutableRefObject<HTMLElement | null>;

describe("useLayoutModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("composes docker, sidebar, main, and style props via helper hooks", () => {
    const onMainMiddleScroll = jest.fn();
    const bottomContent = <footer>tools</footer>;
    const children = <section>content</section>;
    const sidebarProps = { collapsed: false };

    const containerRef = createDivRef();
    useIsMobileMock.mockReturnValue(true);
    useLayoutContainerRefMock.mockReturnValue(containerRef);

    const dockerModel: { docker: DockerViewProps; dockerHeight: number } = {
      docker: {
        shouldRender: true,
        dockerRef: createDivRef(),
        content: bottomContent,
      },
      dockerHeight: 96,
    };
    useDockerViewModelMock.mockReturnValue(dockerModel);

    const onToggleSidebar = jest.fn();
    const sidebarModel: {
      sidebar: SidebarViewProps;
      resizer: ResizerViewProps;
      sidebarWidth: number | null;
      onToggleSidebar: () => void;
    } = {
      sidebar: {
        ref: createDivRef(),
        props: { role: "complementary" },
      },
      resizer: {
        visible: true,
        onPointerDown: jest.fn(),
      },
      sidebarWidth: 320,
      onToggleSidebar,
    };
    useSidebarViewModelMock.mockReturnValue(sidebarModel);

    const mainModel: { main: MainViewProps } = {
      main: {
        isMobile: true,
        onToggleSidebar,
        contentRef: createElementRef(),
        children,
      },
    };
    useMainViewModelMock.mockReturnValue(mainModel);

    const containerStyle = { "--docker-h": "96px" };
    useContainerStyleMock.mockReturnValue(containerStyle);

    const { result } = renderHook(() =>
      useLayoutModel({
        children,
        bottomContent,
        sidebarProps,
        onMainMiddleScroll,
      }),
    );

    expect(result.current.viewProps).toEqual({
      containerRef,
      containerStyle,
      sidebar: sidebarModel.sidebar,
      resizer: sidebarModel.resizer,
      main: mainModel.main,
      docker: dockerModel.docker,
    });

    expect(useDockerViewModelMock).toHaveBeenCalledWith({
      bottomContent,
      shouldRenderDocker: true,
    });
    expect(useSidebarViewModelMock).toHaveBeenCalledWith({
      isMobile: true,
      containerRef,
      sidebarProps,
    });
    expect(useMainViewModelMock).toHaveBeenCalledWith({
      isMobile: true,
      children,
      onToggleSidebar,
      onMainMiddleScroll,
    });
    expect(useContainerStyleMock).toHaveBeenCalledWith({
      shouldRenderDocker: true,
      dockerHeight: dockerModel.dockerHeight,
      isMobile: true,
      sidebarWidth: sidebarModel.sidebarWidth,
    });
  });

  test("falls back to defaults when docker and sidebar props are omitted", () => {
    const children = <div>slot</div>;
    const containerRef = createDivRef();
    useIsMobileMock.mockReturnValue(false);
    useLayoutContainerRefMock.mockReturnValue(containerRef);

    const dockerModel: { docker: DockerViewProps; dockerHeight: number } = {
      docker: {
        shouldRender: false,
        dockerRef: createDivRef(),
        content: null,
      },
      dockerHeight: 0,
    };
    useDockerViewModelMock.mockReturnValue(dockerModel);

    const sidebarModel: {
      sidebar: SidebarViewProps;
      resizer: ResizerViewProps;
      sidebarWidth: number | null;
      onToggleSidebar: () => void;
    } = {
      sidebar: {
        ref: createDivRef(),
        props: {},
      },
      resizer: {
        visible: false,
        onPointerDown: jest.fn(),
      },
      sidebarWidth: null,
      onToggleSidebar: jest.fn(),
    };
    useSidebarViewModelMock.mockReturnValue(sidebarModel);

    const mainModel: { main: MainViewProps } = {
      main: {
        isMobile: false,
        onToggleSidebar: sidebarModel.onToggleSidebar,
        contentRef: createElementRef(),
        children,
      },
    };
    useMainViewModelMock.mockReturnValue(mainModel);

    const containerStyle = { "--docker-h": "0px" };
    useContainerStyleMock.mockReturnValue(containerStyle);

    const { result } = renderHook(() =>
      useLayoutModel({
        children,
      }),
    );

    expect(result.current.viewProps).toEqual({
      containerRef,
      containerStyle,
      sidebar: sidebarModel.sidebar,
      resizer: sidebarModel.resizer,
      main: mainModel.main,
      docker: dockerModel.docker,
    });

    expect(useDockerViewModelMock).toHaveBeenCalledWith({
      bottomContent: null,
      shouldRenderDocker: false,
    });

    expect(useSidebarViewModelMock).toHaveBeenCalledWith({
      isMobile: false,
      containerRef,
      sidebarProps: {},
    });

    expect(useMainViewModelMock).toHaveBeenCalledWith({
      isMobile: false,
      children,
      onToggleSidebar: sidebarModel.onToggleSidebar,
      onMainMiddleScroll: undefined,
    });

    expect(useContainerStyleMock).toHaveBeenCalledWith({
      shouldRenderDocker: false,
      dockerHeight: dockerModel.dockerHeight,
      isMobile: false,
      sidebarWidth: sidebarModel.sidebarWidth,
    });
  });
});
