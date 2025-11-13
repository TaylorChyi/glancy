import PropTypes from "prop-types";
import styles from "../../Layout.module.css";

function DockerSection({ shouldRender, dockerRef, content }) {
  if (!shouldRender) {
    return null;
  }
  return (
    <div
      id="docker"
      ref={dockerRef}
      className={styles.docker}
      aria-label="底部工具条"
    >
      <div className={styles["docker-inner"]}>{content}</div>
    </div>
  );
}

DockerSection.propTypes = {
  shouldRender: PropTypes.bool.isRequired,
  dockerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  content: PropTypes.node,
};

DockerSection.defaultProps = {
  content: null,
};

export default DockerSection;
