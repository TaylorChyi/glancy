import PropTypes from "prop-types";
import Sidebar from "@shared/components/Sidebar";
import LayoutResizer from "./parts/LayoutResizer.jsx";
import MainArea from "./parts/MainArea.jsx";
import styles from "./Layout.module.css";

function LayoutView({ containerRef, containerStyle, sidebar, resizer, main, docker }) {
  return (
    <div ref={containerRef} id="app" className={styles.app} style={containerStyle}>
      <Sidebar ref={sidebar.ref} {...sidebar.props} />
      <LayoutResizer visible={resizer.visible} onPointerDown={resizer.onPointerDown} />
      <MainArea
        isMobile={main.isMobile}
        onToggleSidebar={main.onToggleSidebar}
        contentRef={main.contentRef}
        docker={docker}
      >
        {main.children}
      </MainArea>
    </div>
  );
}

LayoutView.propTypes = {
  containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  containerStyle: PropTypes.shape({}).isRequired,
  sidebar: PropTypes.shape({
    ref: PropTypes.shape({ current: PropTypes.any }).isRequired,
    props: PropTypes.shape({}).isRequired,
  }).isRequired,
  resizer: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    onPointerDown: PropTypes.func.isRequired,
  }).isRequired,
  main: PropTypes.shape({
    isMobile: PropTypes.bool.isRequired,
    onToggleSidebar: PropTypes.func.isRequired,
    contentRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    children: PropTypes.node.isRequired,
  }).isRequired,
  docker: PropTypes.shape({
    shouldRender: PropTypes.bool.isRequired,
    dockerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    content: PropTypes.node,
  }).isRequired,
};

export default LayoutView;
