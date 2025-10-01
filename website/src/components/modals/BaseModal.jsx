import PropTypes from "prop-types";
import Modal from "./Modal.jsx";
import { useLanguage } from "@/context";

function BaseModal({
  open,
  onClose,
  className = "",
  children,
  closeLabel,
  renderCloseButton,
  showDefaultCloseButton,
  ariaLabelledBy,
  ariaDescribedBy,
}) {
  const { t } = useLanguage();
  if (!open) return null;

  const resolvedCloseLabel = closeLabel ?? t.close;

  return (
    <Modal
      onClose={onClose}
      className={className}
      closeLabel={resolvedCloseLabel}
      renderCloseButton={renderCloseButton}
      showDefaultCloseButton={showDefaultCloseButton}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
    >
      {children}
    </Modal>
  );
}

BaseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  closeLabel: PropTypes.string,
  renderCloseButton: PropTypes.func,
  showDefaultCloseButton: PropTypes.bool,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

export default BaseModal;
