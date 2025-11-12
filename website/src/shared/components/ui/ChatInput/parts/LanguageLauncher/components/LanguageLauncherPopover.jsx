import PropTypes from "prop-types";
import Popover from "@shared/components/ui/Popover/Popover.jsx";
import LanguageLauncherMenu from "./LanguageLauncherMenu.jsx";

export default function LanguageLauncherPopover({
  groupLabel,
  state,
  hoverGuards,
  swapAction,
}) {
  return (
    <Popover
      isOpen={state.open}
      anchorRef={state.triggerRef}
      onClose={state.handleClose}
      placement="top"
      align="start"
      fallbackPlacements={["bottom"]}
      offset={12}
    >
      {state.open ? (
        <LanguageLauncherMenu
          groupLabel={groupLabel}
          state={state}
          hoverGuards={hoverGuards}
          swapAction={swapAction}
        />
      ) : null}
    </Popover>
  );
}

LanguageLauncherPopover.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  state: PropTypes.object.isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onSwap: PropTypes.func.isRequired,
  }),
};

LanguageLauncherPopover.defaultProps = {
  swapAction: null,
};
