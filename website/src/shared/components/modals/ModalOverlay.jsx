import PropTypes from "prop-types";

import styles from "./Modal.module.css";

function ModalOverlay({ onClose, children }) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      {children}
    </div>
  );
}

ModalOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default ModalOverlay;
