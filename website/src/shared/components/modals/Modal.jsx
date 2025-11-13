import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import ModalContent from "./ModalContent.jsx";
import styles from "./Modal.module.css";
import { useModalLifecycle } from "./hooks/useModalLifecycle";

function Modal({
  onClose,
  className = "",
  children,
  closeLabel = "Close",
  closeButton,
  hideDefaultCloseButton = false,
  ariaLabelledBy,
  ariaDescribedBy,
}) {
  const lifecycle = useModalLifecycle(onClose);
  if (!lifecycle) return null;
  const { contentRef, root } = lifecycle;
  const contentClassName = className ? `${styles.content} ${className}` : styles.content;
  const shouldRenderDefaultCloseButton = !hideDefaultCloseButton && !closeButton;
  return createPortal(
    <ModalContent
      onClose={onClose}
      contentClassName={contentClassName}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
      contentRef={contentRef}
      closeButton={closeButton}
      shouldRenderDefaultCloseButton={shouldRenderDefaultCloseButton}
      closeLabel={closeLabel}
    >
      {children}
    </ModalContent>,
    root,
  );
}

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  closeLabel: PropTypes.string,
  closeButton: PropTypes.node,
  hideDefaultCloseButton: PropTypes.bool,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

export default Modal;
