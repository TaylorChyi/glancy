/**
 * 背景：
 *  - Sidebar 既要处理业务逻辑又要渲染结构，难以扩展测试。
 * 目的：
 *  - 精简为容器组件，使用 Hook 聚合逻辑并将数据传递给展示层组件。
 * 关键决策与取舍：
 *  - 维持 forwardRef 以兼容既有外部调用；同时按照“容器 + 展示”模式拆分导航、布局，
 *    舍弃继续在此文件内拼接 DOM 的方案，从而提升可维护性。
 * 影响范围：
 *  - DOM 结构保持一致，调用方仅感知到更清晰的组件边界。
 * 演进与TODO：
 *  - 可在 Hook 中扩展更多导航项或特性开关，容器层保持稳定。
 */
import { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";
import SidebarHistorySection from "./SidebarHistorySection.jsx";
import SidebarUserSection from "./SidebarUserSection.jsx";
import SidebarHeader from "./header/SidebarHeader.jsx";
import SidebarLayout from "./layout/SidebarLayout.jsx";
import useSidebarNavigation from "./hooks/useSidebarNavigation.js";

function Sidebar(
  {
    isMobile: mobileProp,
    open,
    onClose,
    onShowDictionary,
    activeView,
    onSelectHistory,
  },
  ref,
) {
  const navigationState = useSidebarNavigation({
    isMobile: mobileProp,
    open,
    onClose,
    onShowDictionary,
    activeView,
  });

  const historyAriaLabel = useMemo(() => {
    return navigationState.historyLabel || navigationState.entriesLabel;
  }, [navigationState.entriesLabel, navigationState.historyLabel]);

  return (
    <SidebarLayout
      ref={ref}
      isMobile={navigationState.isMobile}
      open={navigationState.isOpen}
      showOverlay={navigationState.shouldShowOverlay}
      onOverlayClick={
        navigationState.isMobile ? navigationState.closeSidebar : undefined
      }
      navigation={
        <SidebarHeader
          items={navigationState.navigationActions}
          ariaLabel={navigationState.headerLabel}
        />
      }
      historyAriaLabel={historyAriaLabel}
      historySection={
        <SidebarHistorySection onSelectHistory={onSelectHistory} />
      }
      footerSection={<SidebarUserSection />}
    />
  );
}

Sidebar.propTypes = {
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onShowDictionary: PropTypes.func,
  activeView: PropTypes.string,
  onSelectHistory: PropTypes.func,
};

Sidebar.defaultProps = {
  isMobile: undefined,
  open: false,
  onClose: undefined,
  onShowDictionary: undefined,
  activeView: undefined,
  onSelectHistory: undefined,
};

export default forwardRef(Sidebar);
