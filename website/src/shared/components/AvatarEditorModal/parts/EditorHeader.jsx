import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";

function EditorHeader({ title, description }) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

EditorHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default EditorHeader;
