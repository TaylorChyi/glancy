import usePopoverPositioning from "./usePopoverPositioning";
import PopoverContent from "./PopoverContent.jsx";
import {
  getPopoverClassName,
  getPopoverInlineStyles,
} from "./popoverHelpers.js";

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
    usePopoverPositioning({
      anchorRef,
      isOpen,
      placement,
      fallbackPlacements,
      align,
      offset,
      onClose,
    });

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const classNames = getPopoverClassName(className);
  const inlineStyles = getPopoverInlineStyles(position, style);

  return (
    <PopoverContent
      setContentNode={setContentNode}
      className={classNames}
      visible={visible}
      activePlacement={activePlacement}
      inlineStyles={inlineStyles}
      portalTarget={document.body}
    >
      {children}
    </PopoverContent>
  );
}

export default Popover;
