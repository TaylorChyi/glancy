import PropTypes from "prop-types";
import AvatarEditorModalView from "./AvatarEditorModalView.jsx";
import { useAvatarEditorModalModel } from "./useAvatarEditorModalModel.ts";

function AvatarEditorModal(props) {
  const { isOpen, viewProps } = useAvatarEditorModalModel(props);
  if (!isOpen) {
    return null;
  }
  return <AvatarEditorModalView {...viewProps} />;
}

AvatarEditorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  source: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  labels: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    zoomIn: PropTypes.string,
    zoomOut: PropTypes.string,
    cancel: PropTypes.string,
    confirm: PropTypes.string,
  }),
  isProcessing: PropTypes.bool,
};

AvatarEditorModal.defaultProps = {
  source: "",
  labels: undefined,
  isProcessing: false,
};

export default AvatarEditorModal;
