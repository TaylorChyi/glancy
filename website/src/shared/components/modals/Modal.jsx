import PropTypes from "prop-types";
import ModalContent from "./ModalContent.jsx";
import styles from "./Modal.module.css";
import { useModalPortal } from "./hooks/useModalPortal";

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
  const portal = useModalPortal(onClose);
  if (!portal) return null;
  const { contentRef, renderInPortal } = portal;
  const contentClassName = className ? `${styles.content} ${className}` : styles.content;
  const shouldRenderDefaultCloseButton = !hideDefaultCloseButton && !closeButton;
  return renderInPortal(
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
