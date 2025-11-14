import PropTypes from "prop-types";

import { withStopPropagation } from "@shared/utils/stopPropagation.js";

import ModalCloseControl from "./ModalCloseControl.jsx";

const ModalDialog = ({
  contentClassName,
  ariaLabelledBy,
  ariaDescribedBy,
  contentRef,
  closeButton,
  shouldRenderDefaultCloseButton,
  closeLabel,
  onClose,
  children,
}) => (
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
);

ModalDialog.propTypes = {
  contentClassName: PropTypes.string.isRequired,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  contentRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  closeButton: PropTypes.node,
  shouldRenderDefaultCloseButton: PropTypes.bool.isRequired,
  closeLabel: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

ModalDialog.defaultProps = {
  ariaLabelledBy: undefined,
  ariaDescribedBy: undefined,
  closeButton: null,
};

export default ModalDialog;
