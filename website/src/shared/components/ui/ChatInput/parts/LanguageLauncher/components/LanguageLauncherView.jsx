import PropTypes from "prop-types";
import styles from "../../../ChatInput.module.css";
import LanguageLauncherTrigger from "./LanguageLauncherTrigger.jsx";
import LanguageLauncherPopover from "./LanguageLauncherPopover.jsx";

export default function LanguageLauncherView({
  groupLabel,
  hoverGuards,
  state,
  swapAction,
}) {
  return (
    <div className={styles["language-launcher-wrapper"]}>
      <LanguageLauncherTrigger
        groupLabel={groupLabel}
        open={state.open}
        onToggle={state.handleToggle}
        triggerRef={state.triggerRef}
        hoverGuards={hoverGuards}
      />
      <LanguageLauncherPopover
        groupLabel={groupLabel}
        state={state}
        hoverGuards={hoverGuards}
        swapAction={swapAction}
      />
    </div>
  );
}

LanguageLauncherView.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  state: PropTypes.object.isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onSwap: PropTypes.func.isRequired,
  }),
};

LanguageLauncherView.defaultProps = {
  swapAction: null,
};
