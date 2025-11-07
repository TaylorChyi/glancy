import PropTypes from "prop-types";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import UpgradeModal from "@shared/components/modals/UpgradeModal.jsx";

function TtsFeedbackSurfaces({
  feedback,
  upgradeLabel,
  upgradeButtonClassName,
}) {
  return (
    <>
      <FeedbackHub
        popup={{
          open: feedback.isPopupOpen,
          message: feedback.popupMessage,
          onClose: feedback.closePopup,
          renderActions: () => (
            <button
              type="button"
              className={upgradeButtonClassName}
              onClick={feedback.openUpgrade}
            >
              {upgradeLabel}
            </button>
          ),
        }}
        toast={{
          open: feedback.isToastOpen,
          message: feedback.toastMessage,
          onClose: feedback.closeToast,
        }}
      />
      <UpgradeModal
        open={feedback.isUpgradeOpen}
        onClose={feedback.closeUpgrade}
      />
    </>
  );
}

TtsFeedbackSurfaces.propTypes = {
  feedback: PropTypes.shape({
    isPopupOpen: PropTypes.bool.isRequired,
    popupMessage: PropTypes.string.isRequired,
    closePopup: PropTypes.func.isRequired,
    openUpgrade: PropTypes.func.isRequired,
    isUpgradeOpen: PropTypes.bool.isRequired,
    closeUpgrade: PropTypes.func.isRequired,
    isToastOpen: PropTypes.bool.isRequired,
    toastMessage: PropTypes.string.isRequired,
    closeToast: PropTypes.func.isRequired,
  }).isRequired,
  upgradeLabel: PropTypes.string.isRequired,
  upgradeButtonClassName: PropTypes.string,
};

TtsFeedbackSurfaces.defaultProps = {
  upgradeButtonClassName: undefined,
};

export default TtsFeedbackSurfaces;
