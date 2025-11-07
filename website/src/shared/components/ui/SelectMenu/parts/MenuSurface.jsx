import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";

import OptionList from "./OptionList.jsx";
import { OptionShape } from "../optionNormalizer.js";

export default function MenuSurface({
  open,
  anchorRef,
  onClose,
  menuRef,
  options,
  activeValue,
  onSelect,
}) {
  return (
    <Popover
      isOpen={open}
      anchorRef={anchorRef}
      onClose={onClose}
      placement="top"
      align="start"
      fallbackPlacements={["bottom"]}
      offset={12}
    >
      <OptionList
        options={options}
        activeValue={activeValue}
        menuRef={menuRef}
        open={open}
        onSelect={onSelect}
      />
    </Popover>
  );
}

MenuSurface.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onClose: PropTypes.func.isRequired,
  menuRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  options: PropTypes.arrayOf(OptionShape).isRequired,
  activeValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};
