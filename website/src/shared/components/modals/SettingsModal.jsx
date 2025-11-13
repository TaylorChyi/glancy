import PropTypes from "prop-types";
import SettingsModalView from "./SettingsModalView.jsx";
import { useSettingsModalModel } from "./useSettingsModalModel.ts";

function SettingsModal({ open, onClose, initialSection }) {
  const { viewProps } = useSettingsModalModel({
    open,
    onClose,
    initialSection,
  });
  return <SettingsModalView {...viewProps} />;
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialSection: PropTypes.string,
};

SettingsModal.defaultProps = {
  initialSection: undefined,
};

export default SettingsModal;
