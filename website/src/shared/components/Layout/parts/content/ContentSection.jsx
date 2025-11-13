import PropTypes from "prop-types";
import styles from "../../Layout.module.css";

function ContentSection({ contentRef, children }) {
  return (
    <section id="content" ref={contentRef} className={styles.content}>
      <div className={styles["content-inner"]}>{children}</div>
    </section>
  );
}

ContentSection.propTypes = {
  contentRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  children: PropTypes.node.isRequired,
};

export default ContentSection;
