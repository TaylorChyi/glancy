import { createPortal } from "react-dom";

function PopoverContent({
  setContentNode,
  className,
  visible,
  activePlacement,
  inlineStyles,
  portalTarget,
  children,
}) {
  const target = portalTarget ?? document.body;

  return createPortal(
    <div
      ref={setContentNode}
      className={className}
      data-visible={visible}
      data-placement={activePlacement}
      style={inlineStyles}
    >
      {children}
    </div>,
    target,
  );
}

export default PopoverContent;
