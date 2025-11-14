import { useCallback } from "react";
import { createPortal } from "react-dom";

import { useModalLifecycle } from "./useModalLifecycle";

export const useModalPortal = (onClose) => {
  const lifecycle = useModalLifecycle(onClose);

  const root = lifecycle?.root ?? null;
  const contentRef = lifecycle?.contentRef ?? null;

  const renderInPortal = useCallback(
    (node) => {
      if (!root) {
        return null;
      }

      return createPortal(node, root);
    },
    [root],
  );

  return {
    contentRef,
    renderInPortal,
  };
};
