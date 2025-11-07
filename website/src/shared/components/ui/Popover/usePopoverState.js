import { useCallback, useRef, useState } from "react";

export function usePopoverCoreState(initialPlacement) {
  const contentRef = useRef(null);
  const frameRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const [activePlacement, setActivePlacement] = useState(initialPlacement);

  const setContentNode = useCallback((node) => {
    contentRef.current = node;
  }, []);

  return {
    contentRef,
    frameRef,
    position,
    setPosition,
    visible,
    setVisible,
    activePlacement,
    setActivePlacement,
    setContentNode,
  };
}
