/**
 * 背景：
 *  - 原 Sidebar 组件同时渲染结构与管理状态，导致结构难以复用与测试。
 * 目的：
 *  - 将 `<aside>` 骨架与 overlay 控制独立成布局组件，使容器专注于数据拼装。
 * 关键决策与取舍：
 *  - 采用 forwardRef 以保持既有引用能力，并让布局只关注静态结构；
 *    若继续在容器内直接渲染 DOM，会与“容器 + 展示”模式冲突。
 * 影响范围：
 *  - Sidebar.jsx 改为调用该布局组件，其余调用方感知到的 DOM 结构保持一致。
 * 演进与TODO：
 *  - 若后续需要在头部插入更多操作，可以通过 `navigation`/`headerSlot` 扩展渲染节点。
 */
import { forwardRef } from "react";
import PropTypes from "prop-types";
import styles from "../Sidebar.module.css";

const SidebarLayout = forwardRef(function SidebarLayout(
  {
    isMobile,
    open,
    showOverlay,
    onOverlayClick,
    navigation,
    historyAriaLabel,
    historySection,
    footerSection,
  },
  ref,
) {
  return (
    <>
      {showOverlay ? (
        <div className="sidebar-overlay" onClick={onOverlayClick} />
      ) : null}
      <aside
        ref={ref}
        data-testid="sidebar"
        className={`sidebar${isMobile ? (open ? " mobile-open" : "") : ""} ${styles.container}`}
      >
        <div className={styles.top} data-testid="sidebar-header">
          {navigation}
        </div>
        <nav
          className={styles.entries}
          aria-label={historyAriaLabel}
          data-testid="sidebar-scroll"
        >
          {historySection}
        </nav>
        <footer className={styles.footer} data-testid="sidebar-footer">
          {footerSection}
        </footer>
      </aside>
    </>
  );
});

SidebarLayout.propTypes = {
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  showOverlay: PropTypes.bool,
  onOverlayClick: PropTypes.func,
  navigation: PropTypes.node.isRequired,
  historyAriaLabel: PropTypes.string,
  historySection: PropTypes.node.isRequired,
  footerSection: PropTypes.node.isRequired,
};

SidebarLayout.defaultProps = {
  isMobile: false,
  open: false,
  showOverlay: false,
  onOverlayClick: undefined,
  historyAriaLabel: undefined,
};

export default SidebarLayout;
