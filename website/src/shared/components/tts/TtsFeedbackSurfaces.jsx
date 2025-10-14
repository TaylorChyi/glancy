/**
 * 背景：
 *  - TTS 控件各自渲染 MessagePopup、UpgradeModal 与 Toast，
 *    导致视觉与可访问性调整需多处同步。
 * 目的：
 *  - 以展示组件承载统一的反馈层渲染，并通过组合接入 Hook 提供的状态。
 * 关键决策与取舍：
 *  - 使用组合模式而非继承：调用方传入 feedback 契约和样式类，
 *    维持控件外观可定制；
 *  - 统一按钮插槽为升级入口，避免重复编写 DOM 结构。
 * 影响范围：
 *  - 目前为 TtsButton 与 PronounceableWord，两者共享反馈 UI。
 * 演进与TODO：
 *  - TODO：若未来有多按钮操作，可扩展 children 插槽而不破坏现有 API。
 */
import PropTypes from "prop-types";
import MessagePopup from "@shared/components/ui/MessagePopup";
import Toast from "@shared/components/ui/Toast";
import UpgradeModal from "@shared/components/modals/UpgradeModal.jsx";

function TtsFeedbackSurfaces({
  feedback,
  upgradeLabel,
  upgradeButtonClassName,
}) {
  return (
    <>
      <MessagePopup
        open={feedback.isPopupOpen}
        message={feedback.popupMessage}
        onClose={feedback.closePopup}
      >
        <button
          type="button"
          className={upgradeButtonClassName}
          onClick={feedback.openUpgrade}
        >
          {upgradeLabel}
        </button>
      </MessagePopup>
      <UpgradeModal
        open={feedback.isUpgradeOpen}
        onClose={feedback.closeUpgrade}
      />
      <Toast
        open={feedback.isToastOpen}
        message={feedback.toastMessage}
        onClose={feedback.closeToast}
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
