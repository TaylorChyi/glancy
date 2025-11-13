import { useMemo } from "react";

export const useSettingsNavCloseAction = (renderCloseAction, className) =>
  useMemo(() => {
    if (typeof renderCloseAction !== "function") {
      return null;
    }
    return renderCloseAction({ className });
  }, [className, renderCloseAction]);
