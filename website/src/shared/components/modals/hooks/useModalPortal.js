import { useCallback } from "react";
import { createPortal } from "react-dom";

import { useModalLifecycle } from "./useModalLifecycle";

export const useModalPortal = (onClose) => {
  const lifecycle = useModalLifecycle(onClose);

  if (!lifecycle) {
    return null;
  }

  const { root, contentRef } = lifecycle;

  const renderInPortal = useCallback(
    (node) => createPortal(node, root),
    [root],
  );

  return {
    contentRef,
    renderInPortal,
  };
};
