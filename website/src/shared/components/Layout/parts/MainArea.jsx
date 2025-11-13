import PropTypes from "prop-types";
import styles from "../Layout.module.css";
import MobileSidebarToggle from "./MobileSidebarToggle.jsx";
import ContentSection from "./content/ContentSection.jsx";
import DockerSection from "./docker/DockerSection.jsx";

function MainArea({ isMobile, onToggleSidebar, contentRef, docker, children }) {
  return (
    <main id="main" className={styles.main}>
      <MobileSidebarToggle isMobile={isMobile} onToggleSidebar={onToggleSidebar} />
      <ContentSection contentRef={contentRef}>{children}</ContentSection>
      <DockerSection
        shouldRender={docker.shouldRender}
        dockerRef={docker.dockerRef}
        content={docker.content}
      />
    </main>
  );
}

MainArea.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
  contentRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  docker: PropTypes.shape({
    shouldRender: PropTypes.bool.isRequired,
    dockerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    content: PropTypes.node,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

export default MainArea;
