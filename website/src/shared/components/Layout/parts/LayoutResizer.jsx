import PropTypes from "prop-types";
import styles from "../Layout.module.css";

function LayoutResizer({ visible, onPointerDown }) {
  if (!visible) {
    return null;
  }
  return (
    <div
      className={styles.resizer}
      role="separator"
      aria-orientation="vertical"
      aria-hidden="true"
      onPointerDown={onPointerDown}
    />
  );
}

LayoutResizer.propTypes = {
  visible: PropTypes.bool.isRequired,
  onPointerDown: PropTypes.func.isRequired,
};

export default LayoutResizer;
