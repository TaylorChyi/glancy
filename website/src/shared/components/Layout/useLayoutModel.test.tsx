/* eslint-env jest */
import React from "react";
import { jest } from "@jest/globals";
import {
  createDivRef,
  createDockerModel,
  createMainModel,
  createSidebarModel,
  type LayoutScenarioOptions,
} from "./useLayoutModel.test.helpers.tsx";
import {
  createComposedScenario,
  createFallbackScenario,
  expectHookUsage,
  expectViewProps,
} from "./useLayoutModel.test.support.tsx";
import { renderHook } from "@testing-library/react";
const useIsMobileMock = jest.fn();
const useLayoutContainerRefMock = jest.fn();
const useDockerViewModelMock = jest.fn();
const useSidebarViewModelMock = jest.fn();
const useMainViewModelMock = jest.fn();
const useContainerStyleMock = jest.fn();
const moduleMocks: Array<[string, string, jest.Mock]> = [
  ["@shared/utils/device.js", "useIsMobile", useIsMobileMock],
  ["./hooks/useLayoutContainerRef.js", "useLayoutContainerRef", useLayoutContainerRefMock],
  ["./hooks/useDockerViewModel.js", "useDockerViewModel", useDockerViewModelMock],
  ["./hooks/useSidebarViewModel.js", "useSidebarViewModel", useSidebarViewModelMock],
  ["./hooks/useMainViewModel.js", "useMainViewModel", useMainViewModelMock],
  ["./hooks/useContainerStyle.js", "useContainerStyle", useContainerStyleMock],
];
moduleMocks.forEach(([path, exportName, mock]) => {
  jest.unstable_mockModule(path, () => ({
    __esModule: true,
    [exportName]: mock,
  }));
});
const { useLayoutModel } = await import("./useLayoutModel.ts");
const renderLayoutModelHook = (options: LayoutScenarioOptions = {}) => {
  const {
    isMobile = false,
    children = <div>slot</div>,
    bottomContent = null,
    sidebarProps = {},
    onMainMiddleScroll,
    dockerModel: providedDockerModel,
    sidebarModel: providedSidebarModel,
    mainModel: providedMainModel,
    containerStyle: providedContainerStyle,
  } = options;

  const containerRef = createDivRef();
  useIsMobileMock.mockReturnValue(isMobile);
  useLayoutContainerRefMock.mockReturnValue(containerRef);

  const dockerModel =
    providedDockerModel ??
    createDockerModel({
      shouldRender: Boolean(bottomContent),
      content: bottomContent,
    });
  const sidebarModel = providedSidebarModel ?? createSidebarModel();
  const mainModel =
    providedMainModel ??
    createMainModel({
      isMobile,
      children,
      onToggleSidebar: sidebarModel.onToggleSidebar,
      overrides: { onMainMiddleScroll },
    });
  const containerStyle =
    providedContainerStyle ?? { "--docker-h": `${dockerModel.dockerHeight}px` };
  useDockerViewModelMock.mockReturnValue(dockerModel);
  useSidebarViewModelMock.mockReturnValue(sidebarModel);
  useMainViewModelMock.mockReturnValue(mainModel);
  useContainerStyleMock.mockReturnValue(containerStyle);

  const { result } = renderHook(() =>
    useLayoutModel({
      children,
      bottomContent,
      sidebarProps,
      onMainMiddleScroll,
    }),
  );

  return { result, containerRef, dockerModel, sidebarModel, mainModel, containerStyle };
};
describe("useLayoutModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("composes docker, sidebar, main, and style props via helper hooks", () => {
    const onMainMiddleScroll = jest.fn();
    const bottomContent = <footer>tools</footer>;
    const children = <section>content</section>;
    const sidebarProps = { collapsed: false };
    const onToggleSidebar = jest.fn();
    const {
      result,
      containerRef,
      dockerModel,
      sidebarModel,
      mainModel,
      containerStyle,
    } = renderLayoutModelHook(
      createComposedScenario({
        children,
        bottomContent,
        sidebarProps,
        onMainMiddleScroll,
        onToggleSidebar,
      }),
    );
    expectViewProps({
      result,
      containerRef,
      containerStyle,
      sidebarModel,
      mainModel,
      dockerModel,
    });
    expectHookUsage({
      bottomContent,
      shouldRenderDocker: true,
      isMobile: true,
      containerRef,
      sidebarProps,
      children,
      onToggleSidebar,
      onMainMiddleScroll,
      dockerModel,
      sidebarModel,
      mocks: {
        useDockerViewModelMock,
        useSidebarViewModelMock,
        useMainViewModelMock,
        useContainerStyleMock,
      },
    });
    });
  test("falls back to defaults when docker and sidebar props are omitted", () => {
    const children = <div>slot</div>;
    const {
      result,
      containerRef,
      dockerModel,
      sidebarModel,
      mainModel,
      containerStyle,
    } = renderLayoutModelHook(createFallbackScenario({ children }));
    expectViewProps({
      result,
      containerRef,
      containerStyle,
      sidebarModel,
      mainModel,
      dockerModel,
    });
    expectHookUsage({
      bottomContent: null,
      shouldRenderDocker: false,
      isMobile: false,
      containerRef,
      sidebarProps: {},
      children,
      onToggleSidebar: sidebarModel.onToggleSidebar,
      onMainMiddleScroll: undefined,
      dockerModel,
      sidebarModel,
      mocks: {
        useDockerViewModelMock,
        useSidebarViewModelMock,
        useMainViewModelMock,
        useContainerStyleMock,
      },
    });
  });
});
