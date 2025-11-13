import PropTypes from "prop-types";
import styles from "./Modal.module.css";
import { withStopPropagation } from "@shared/utils/stopPropagation.js";
import ModalCloseControl from "./ModalCloseControl.jsx";

function ModalContent({
  onClose,
  contentClassName,
  ariaLabelledBy,
  ariaDescribedBy,
  contentRef,
  closeButton,
  shouldRenderDefaultCloseButton,
  closeLabel,
  children,
}) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        ref={contentRef}
        onClick={withStopPropagation()}
      >
        <ModalCloseControl
          closeButton={closeButton}
          shouldRenderDefaultCloseButton={shouldRenderDefaultCloseButton}
          closeLabel={closeLabel}
          onClose={onClose}
        />
        {children}
      </div>
    </div>
  );
}

ModalContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  contentClassName: PropTypes.string.isRequired,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  contentRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  closeButton: PropTypes.node,
  shouldRenderDefaultCloseButton: PropTypes.bool.isRequired,
  closeLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ModalContent.defaultProps = {
  ariaLabelledBy: undefined,
  ariaDescribedBy: undefined,
  closeButton: null,
};

export default ModalContent;
