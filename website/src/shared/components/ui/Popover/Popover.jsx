import usePopoverPositioning from "./usePopoverPositioning";
import PopoverContent from "./PopoverContent.jsx";
import {
  getPopoverClassName,
  getPopoverInlineStyles,
} from "./popoverHelpers.js";

const renderPopoverContent = ({
  setContentNode,
  className,
  visible,
  activePlacement,
  inlineStyles,
  children,
}) => (
  <PopoverContent
    setContentNode={setContentNode}
    className={className}
    visible={visible}
    activePlacement={activePlacement}
    inlineStyles={inlineStyles}
    portalTarget={document.body}
  >
    {children}
  </PopoverContent>
);

function Popover({
  anchorRef,
  isOpen,
  children,
  onClose,
  placement = "bottom",
  align = "start",
  offset = 8,
  fallbackPlacements = [],
  className,
  style,
}) {
  const { setContentNode, position, visible, activePlacement } =
    usePopoverPositioning({ anchorRef, isOpen, placement, fallbackPlacements, align, offset, onClose });
  if (!isOpen || typeof document === "undefined") return null;
  return renderPopoverContent({
    setContentNode,
    className: getPopoverClassName(className),
    visible,
    activePlacement,
    inlineStyles: getPopoverInlineStyles(position, style),
    children,
  });
}

export default Popover;
